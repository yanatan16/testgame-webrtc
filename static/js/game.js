module.exports = Game;

var eventify = require('./eventify')

function Game(id) {
  var game = this;
  game.$board = $('#board')
  game._id = id;
  game._chans = [];
  game.players = {};
  game.initialize();
}

eventify(Game);

Game.prototype.addChan = function (chan) {
  var game = this;
  game._chans.push(chan)

  chan.onmessage = function (pkt) {
    // console.log('received', pkt)
    var data;
    try {
      var data = JSON.parse(pkt.data)
    } catch (e) {
      throw 'Couldnt parse message from data channel ' + pkt
    }
    // console.log('got packet', data)
    game.fire(data.evt, data.msg, data.id)

    chan._id = data.id
  }

  chan.onclose = function () {
    if (chan._id) {
      game.removePlayer(chan._id)

      // remove the channel
      var index;
      game._chans.forEach(function (ch, i) {
        if (ch._id === chan._id) {
          index = i;
        }
      })
      game._chans.splice(i,1)
    }
  }

  game.updateOthers()
}

Game.prototype.send = function (name, msg) {
  var enc = JSON.stringify({evt:name, msg: msg, id: this._id});
  // console.log('sending', enc)
  this._chans.forEach(function (chan) {
    chan.send(enc)
  })
}

//// -------

Game.prototype.initialize = function () {
  var game = this;
  console.log('starting game!', game._id)

  var pos = [Math.floor(Math.random() * game.$board.height()), Math.floor(Math.random() * game.$board.width())];

  game.on('plyr-update', function (ps, id) {
    game.updatePlayer(id, ps)
  })

  game.addPlayer('me', pos)
  game.initControls()
  this._interval = setInterval(game.gameLoop.bind(game), 10)
}

Game.prototype.removePlayer = function (id) {
  var game = this;
  game.players[id].$.remove()
  delete game.players[id]
}

Game.prototype.updatePlayer = function (id, pos) {
  var game = this;
  if (!game.players[id]) {
    game.addPlayer(id, pos)
  }
  game.players[id].pos = pos

  // console.log('after update', id, pos, game.players)
}

Game.prototype.addPlayer = function (id, pos) {
  var game = this;
  var plyr = {id: id, pos: pos.slice(0)}
  plyr.$ = $('<div>').addClass('player').addClass(id=='me' ? 'me' : 'them').attr('id', id).css({'background-color': '#' + id.slice(id.length - 6)})

  game.$board.find('#' + id).remove()
  game.$board.append(plyr.$)

  game.players[id] = plyr

  console.log('Added player', id, pos, game.players)
}

Game.prototype.updateOthers = function () {
  var game = this;
  game.send('plyr-update', game.players.me.pos)
}

Game.prototype.initControls = function () {
  var game = this;
  var speed = 3;
  $(document).keydown(function (evt) {
    if (evt.which >= 37 && evt.which <= 40) {
      switch (evt.which) {
        case 37:
          game.players.me.pos[1] -= speed;
          break
        case 38:
          game.players.me.pos[0] -= speed;
          break;
        case 39:
          game.players.me.pos[1] += speed;
          break;
        case 40:
          game.players.me.pos[0] += speed;
          break;
      }
      game.updateOthers();
    }
  })

}

Game.prototype.render = function () {
  var game = this;
  Object.keys(game.players).forEach(function (id) {
    var plyr = game.players[id];
    plyr.$.css({top: plyr.pos[0], left: plyr.pos[1]})
  })

}

Game.prototype.gameLoop = function () {
  var game = this;
  game.render()
}