var express = require('express')
  , http = require('http')
  , path = require('path')

var port = process.env.port || 8000
  wsport = process.env.wsport || 8101

var app = express();

app.use(express.logger('dev'))
  .use(express.static(path.join(__dirname, 'static')))


var server = http.createServer(app).listen(port)

console.log('Started express web server on ' + port)

var rtc = require('webrtc.io').listen(server)
console.log('Started rtc/websocket server on same server')
