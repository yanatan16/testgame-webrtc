var rtc = require('../vendor/webrtc/webrtc.io.js')
var Game = require('./game')

rtc.SERVER = function () {
  return {
    'iceServers': [
      {
        'url': 'stun:stun.l.google.com:19302'
      }
    ]
  };
}

$(function () {
  var host = window.document.location.host.replace(/:.*/, '')
  var game

  rtc.connect('ws://' + host + ':8000', 'testroom')
  console.log('made websocket connection')

  rtc.on('connections', function (conns) {
    console.log('got connections', conns)
    game = new Game(rtc._me)
    rtc.fire('ready')
  })

  rtc.on('data stream open', function (chan) {
    console.log('data stream open!')

    game.addChan(chan)
  })

  rtc.on('data stream error', function (err) {
    throw err
  })
})
