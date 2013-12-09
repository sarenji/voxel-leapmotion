var EventEmitter = require('events').EventEmitter
  , _ = require('underscore');

/**
 * Constructor function to create a controller class for Voxel.js using the Leap
 *
 * Takes an options hash, which is automatically passed to the underlying
 * Leap.Controller, which hooks into each frame of the Leap motion device.
 * Leap gesture recognition is enabled by default.
 *
 * Additional options include `jumpPrecision`, which defaults to 25. This jump
 * precision determines the threshold distance your hand should travel upward
 * in a single frame to trigger a jump in Voxel.js.
 *
 * The options hash should also include `game`, a reference to the Voxel.js game
 */
function LeapControls(opts) {
  var defaultLeapOptions, key;

  defaultLeapOptions = {
    enableGestures: true
  };

  // Merge passed-in options hash with the default options.
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

/**
 * This is an internal function that tells the Leap.Controller class to pass
 * through events it emits to the higher level LeapControls class.
 */
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

/**
 * `tick` is a function meant to be run every frame in Voxel.js. It takes
 * information from the Leap, aggregates them, and emits the aggregated
 * information as a `tick` event.
 */
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

// LeapControls inherits from EventEmitter.
_.extend(LeapControls.prototype, EventEmitter.prototype);

// Now we export a function to automatically create a new instance of
// LeapControls and pass in some options.
module.exports = function(opts) {
  var controls = new LeapControls(opts || {});
  return controls;
};
