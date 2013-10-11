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
    self.emit.apply(self, 'ready', arguments);
  });

  this.controller.on('connect', function() {
    self.emit.apply(self, 'connect', arguments);
  });

  this.controller.on('disconnect', function() {
    self.emit.apply(self, 'disconnect', arguments);
  });

  this.controller.on('focus', function() {
    self.emit.apply(self, 'focus', arguments);
  });

  this.controller.on('blur', function() {
    self.emit.apply(self, 'blur', arguments);
  });

  this.controller.on('deviceConnected', function() {
    self.emit.apply(self, 'deviceConnected', arguments);
  });

  this.controller.on('deviceDisconnected', function() {
    self.emit.apply(self, 'deviceDisconnected', arguments);
  });
};

LeapControls.prototype.tick = function(dt) {
  var hand, handId, handCount, gesture, gestureId, gestureCount, x, y, z, frame,
      translation, yTranslation, pointable, pointableId, pointableCount,
      finger, fingerId, fingerCount;

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
    this.emit('hand', frame, hand, handId);
    x = hand.palmPosition[0] / frame.interactionBox.width;
    y = hand.palmPosition[1] / frame.interactionBox.height;
    z = hand.palmPosition[2] / frame.interactionBox.depth;

    if (z <= -.1) {
      if (!this.state.forward) {
        this.state.forward = true;
        this.game.controls.write({forward: true});
      }
      this.game.controls.speed = this.maxSpeed * Math.sin(Math.PI/2 * -(z + .1) / .9);
      console.log(this.game.controls.speed / this.maxSpeed);
    } else {
      if (this.state.forward) {
        this.state.forward = false;
        this.game.controls.write({forward: false});
      }
    }

    if (this.previousFrame && this.previousFrame.valid) {
      translation = frame.translation(this.previousFrame);
      yTranslation = translation[1];
      if (!this.state.jumping && yTranslation >= this.jumpPrecision) {
        this.state.jumping = true;
        this.game.controls.write({jump: true});
      } else if (this.state.jumping &&
          (yTranslation <= -this.jumpPrecision / 2)) {
        this.state.jumping = false;
        this.game.controls.write({jump: false});
      }
    }
  }

  // recognize fingers
  for (fingerId = 0; fingerId < fingerCount; fingerId++) {
    finger = frame.fingers[fingerId];
    this.emit('finger', frame, finger, fingerId);
  }

  // recognize pointables
  for (pointableId = 0; pointableId < pointableCount; pointableId++) {
    pointable = frame.pointables[pointableId];
    this.emit('pointable', frame, pointable, pointableId);
  }

  // recognize gesture
  for (gestureId = 0; gestureId < gestureCount; gestureId++) {
    gesture = frame.gestures[gestureId];
    this.emit('gesture', frame, gesture, gestureId);
  }

  this.previousFrame = frame;
};

_.extend(LeapControls.prototype, EventEmitter.prototype);

module.exports = function(opts) {
  var controls = new LeapControls(opts || {});
  return controls;
};
