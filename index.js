var EventEmitter = require('events').EventEmitter
  , _ = require('underscore');

function LeapControls(opts) {
  var defaultLeapOptions, key;

  defaultLeapOptions = {
    enableGestures: true
  };

  opts.leap = opts.leap || {};
  for (key in defaultLeapOptions) {
    if (!(key in opts.leap)) {
      opts.leap[key] = defaultLeapOptions[key];
    }
  }

  this.game = opts.game;
  this.controller = new Leap.Controller(opts.leap);
  this.previousFrame = null;

  this.attachEvents();
  this.controller.connect();

  this.state = {
    forward: false,
    jumping: false,
    grabbing: false
  };
  this.jumpPrecision = opts.jumpPrecision || 25;
  this.maxSpeed = this.game.controls.max_speed;
}

LeapControls.prototype.attachEvents = function() {
  var self = this;

  this.controller.on('ready', function() {
    var args = [ 'ready' ];
    args.push.apply(args, arguments);
    self.emit.apply(self, args);
  });

  this.controller.on('connect', function() {
    var args = [ 'connect' ];
    args.push.apply(args, arguments);
    self.emit.apply(self, args);
  });

  this.controller.on('disconnect', function() {
    var args = [ 'disconnect' ];
    args.push.apply(args, arguments);
    self.emit.apply(self, args);
  });

  this.controller.on('focus', function() {
    var args = [ 'focus' ];
    args.push.apply(args, arguments);
    self.emit.apply(self, args);
  });

  this.controller.on('blur', function() {
    var args = [ 'blur' ];
    args.push.apply(args, arguments);
    self.emit.apply(self, args);
  });

  this.controller.on('deviceConnected', function() {
    var args = [ 'deviceConnected' ];
    args.push.apply(args, arguments);
    self.emit.apply(self, args);
  });

  this.controller.on('deviceDisconnected', function() {
    var args = [ 'deviceDisconnected' ];
    args.push.apply(args, arguments);
    self.emit.apply(self, args);
  });
};

LeapControls.prototype.tick = function(dt) {
  var hand, handId, handCount, gesture, gestureId, gestureCount, frame,
      pointable, pointableId, pointableCount, finger, fingerId, fingerCount,
      hands = [], gestures = [], pointables = [], fingers = [];

  frame = this.controller.frame();

  if (frame.hands) {
    handCount = frame.hands.length;
  } else {
    handCount = 0;
  }

  if (frame.fingers) {
    fingerCount = frame.fingers.length;
  } else {
    fingerCount = 0;
  }

  if (frame.pointables) {
    pointableCount = frame.pointables.length;
  } else {
    pointableCount = 0;
  }

  if (frame.gestures) {
    gestureCount = frame.gestures.length;
  } else {
    gestureCount = 0;
  }

  // recognize hands
  for (handId = 0; handId < handCount; handId++) {
    hand = frame.hands[handId];
    hands.push(hand);
  }

  // recognize fingers
  for (fingerId = 0; fingerId < fingerCount; fingerId++) {
    finger = frame.fingers[fingerId];
    fingers.push(finger);
  }

  // recognize pointables
  for (pointableId = 0; pointableId < pointableCount; pointableId++) {
    pointable = frame.pointables[pointableId];
    pointables.push(pointable);
  }

  // recognize gesture
  for (gestureId = 0; gestureId < gestureCount; gestureId++) {
    gesture = frame.gestures[gestureId];
    gestures.push(gesture);
  }

  // Emit a 'tick' event with all the recognized features.
  this.emit('tick', dt, frame, {
    hands: hands,
    fingers: fingers,
    pointables: pointables,
    gestures: gestures
  });

  this.previousFrame = frame;
};

_.extend(LeapControls.prototype, EventEmitter.prototype);

module.exports = function(opts) {
  var controls = new LeapControls(opts || {});
  return controls;
};
