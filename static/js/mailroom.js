// mailroom.js
// Simplify communication

var rtc = require('../vendor/webrtc/webrtc.io.js')
var events = require('events')
  , util = require('util')

module.exports = Mailroom

function Mailroom (room, opts) {
  if (!(this instanceof Mailroom)) {
    return new Mailroom(room, opts)
  }

  opts = opts || {}
  var host = opts.host || window.document.location.host
  var ice = opts.ice || {iceServers: [{url: 'stun:stun.l.google.com:19302'}]}
  var protocol = opts.secure ? 'wss' : 'ws'

  this._peers = {}

  this._listen()
  rtc.SERVER = function () {return ice}
  rtc.connect(protocol + '://' + host, room)
}

util.inherits(Mailroom, events.EventEmitter)

Mailroom.prototype._listen = function() {
  var mailroom = this

  rtc.on('connect', function () {
    mailroom.emit('connect')
  })

  rtc.on('connections', function (conns) {
    rtc.fire('ready')
  })

  rtc.on('data stream open', function (chan) {
    var peer = mailroom._peers[chan._id] = new Peer(mailroom, chan)
    mailroom.emit('join', peer)
  })

  function proxy(nm, nm2) {
    rtc.on(nm, function () {
      mailroom.emit.apply(mailroom, [nm2 || nm].concat(Array.prototype.slice.call(arguments)))
    })
  }
}

Mailroom.prototype.id = function () {
  return rtc._me
}

Mailroom.prototype.peer = function (id) {
  return this._peers[id]
}

Mailroom.prototype.eachPeer = function (fn) {
  var mailroom = this
  Object.keys(mailroom._peers).forEach(function (id) {
    fn(mailroom._peers[id], id)
  })
}

Mailroom.prototype.broadcast = function (msg) {
  var mailroom = this
  mailroom.eachPeer(function (peer) {
    peer.send(msg)
  })
}

function Peer(mr, chan) {
  this._mr = mr
  this._chan = chan
  this.id = chan._id
  this._listen()
}

util.inherits(Peer, events.EventEmitter)

Peer.prototype._listen = function () {
  var peer = this
    , mailroom = this._mr

  peer._chan.onclose = function () {
    peer.emit('leave')
    mailroom.emit('leave', peer)
    rtc.fire('remove_peer_connected', {socketId: peer.id})
  }

  peer._chan.onerror = function (err) {
    mailroom.emit('error', err)
  }

  peer._chan.onmessage = function (msg) {
    var json
    try {
      json = JSON.parse(msg.data)
    } catch (e) {
      mailroom.emit('error', new Error('JSON could not parse: ' + msg.data))
      return
    }

    var from = json.from,
      msg = json.msg

    peer.emit('message', msg, mailroom.peer(from))
  }
}

Peer.prototype.send = function (msg) {
  var peer = this
  var obj = {
    from: peer._mr.id(),
    msg: msg
  }
  peer._chan.send(JSON.stringify(obj))
}