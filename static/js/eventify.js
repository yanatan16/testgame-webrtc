
module.exports = function eventify(Obj) {
  // Holds callbacks for certain events.
  Obj.prototype._events = {};

  Obj.prototype.on = function(eventName, callback) {
    this._events[eventName] = this._events[eventName] || [];
    this._events[eventName].push(callback);
  };

  Obj.prototype.fire = function(eventName, _) {
    var events = this._events[eventName];
    var args = Array.prototype.slice.call(arguments, 1);

    if (!events) {
      return;
    }

    for (var i = 0, len = events.length; i < len; i++) {
      events[i].apply(null, args);
    }
  };
}