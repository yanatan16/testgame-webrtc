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

function Game(chan) {
  this.ps = [$('#plyr1'), $('#plyr2')];
  this.me = 0, this.them = 0;
  this.chan = chan;
  this.listen();
}

Game.prototype.start = function () {
  var game = this;
  console.log('starting game!')
  game.select();

  game.on('players-set', function () {
    game.initBoard()
    game.initControls()
    game.gameLoop()
  })
}

// Holds callbacks for certain events.
Game.prototype._events = {};

Game.prototype.on = function(eventName, callback) {
  this._events[eventName] = this._events[eventName] || [];
  this._events[eventName].push(callback);
};

Game.prototype.fire = function(eventName, _) {
  var events = this._events[eventName];
  var args = Array.prototype.slice.call(arguments, 1);

  if (!events) {
    return;
  }

  for (var i = 0, len = events.length; i < len; i++) {
    events[i].apply(null, args);
  }
};

Game.prototype.send = function (name, msg) {
  this.chan.send(JSON.stringify({evt:name, msg: msg}))
}

Game.prototype.listen = function () {
  var game = this;
  game.chan.onmessage = function (pkt) {
    var data;
    try {
      var data = JSON.parse(pkt.data)
    } catch (e) {
      throw 'Couldnt parse message from data channel ' + pkt
    }
    // console.log('got packet', data)
    game.fire(data.evt, data.msg)
  }
}

Game.prototype.select = function () {
  var game = this;
  var randomValue = Math.random();

  game.on('selected', function (value) {
    if (randomValue < parseFloat(value)) {
      game.me = 1, game.them = 2;
    } else {
      game.me = 2, game.them = 1;
    }
    game.me = {id:game.me, $: game.ps[game.me - 1]}
    game.them = {id:game.them, $: game.ps[game.them - 1]}
    console.log('players set!', game.me, game.them)
    game.fire('players-set', {me: game.me.id, them: game.them.id})
  })
  game.send('selected', randomValue)
}

Game.prototype.initBoard = function () {
  var game = this;
  game.me.pos = initPos(game.me.id)
  game.them.pos = initPos(game.them.id)
  game.me.$.addClass('me')
  game.them.$.addClass('them')

  function initPos(id) {
    return [100, 100 + 400 * (id - 1)]
  }
}

Game.prototype.initControls = function () {
  var game = this;
  var speed = 3;
  $(document).keydown(function (evt) {
    if (evt.which >= 37 && evt.which <= 40) {
      switch (evt.which) {
        case 37:
          game.me.pos[1] -= speed;
          break
        case 38:
          game.me.pos[0] -= speed;
          break;
        case 39:
          game.me.pos[1] += speed;
          break;
        case 40:
          game.me.pos[0] += speed;
          break;
      }
      game.send('update', game.me.pos)
    }
  })

  game.on('update', function (otherpos) {
    game.them.pos = otherpos
  })
}

Game.prototype.render = function () {
  var game = this;
  renderObj(game.me)
  renderObj(game.them)

  function renderObj(obj) {
    obj.$.css({top: obj.pos[0], left: obj.pos[1]})
  }
}

Game.prototype.gameLoop = function () {
  this._interval = setInterval(this.render.bind(this), 10 /* 24 fps */)
}