var rtc = require('../vendor/webrtc/webrtc.io.js')
var Game = require('./game')

rtc.SERVER = function () {return null;}

$(function () {
  var host = window.document.location.host.replace(/:.*/, '')

  rtc.connect('ws://' + host + ':8000', 'testroom')
  console.log('made websocket connection')

  rtc.on('connections', function (conns) {
    console.log('got connections', conns)
    rtc.fire('ready')
  })

  rtc.on('data stream open', function (chan) {
    console.log('data stream open!')
    new Game(chan).start()
  })

  rtc.on('data stream close', function () {
    console.log('data stream close')
  })

  rtc.on('data stream data', function (data) {
    console.log('got data!')
  })

  rtc.on('data stream error', function (err) {
    throw err
  })
})
