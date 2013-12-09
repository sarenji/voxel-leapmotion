var createGame = require('voxel-engine')
var texturePath = require('painterly-textures')
var player = require('voxel-player')
var highlight = require('./voxel-highlight')
var voxel = require('voxel')
var controls = require('../../../')

var chunkSize = 16
var chunkDistance = 2
var roomSize = 16

var highlighter = null

var game = createGame({
  chunkSize: chunkSize,
  chunkDistance: chunkDistance,
  texturePath: texturePath('examples/game'),
  // generateVoxelChunk: generator,
  // generate: voxel.generator['Checker'],
  generate: function(i, j, k) {
    if (i < 0) i *= -1;
    if (j < 0) j *= -1;
    if (k < 0) k *= -1;
    var kind = (j % roomSize !== 0 || k % roomSize === 0) ? 3 : 1;
    var number = (i % roomSize) * (j % roomSize) * (k % roomSize);
    return number > 0 ? 0 : kind;
  },
  controls: { discreteFire: true }
});

game.appendTo(document.body);

var createPlayer = player(game);
var avatar = createPlayer();
avatar.possess();
// avatar.yaw.position.set(2, 100, 4);
avatar.yaw.position.set(6, 6, 6);

var x, y, z, grabVoxelPosition;

x = y = z = 0;

var leapControls = controls({game: game});
leapControls.on('tick', function(dt, frame, variables) {
  var translation = null
    , yTranslation = null
    , hand = null
    , hands = variables.hands
    , fingers = variables.fingers;

  // Get position of hand and extract movement
  for (var i = 0; i < hands.length; i++) {
    hand = hands[i];
    x = hand.palmPosition[0] / frame.interactionBox.width;
    y = hand.palmPosition[1] / frame.interactionBox.height;
    z = hand.palmPosition[2] / frame.interactionBox.depth;

    // Change crosshair position
    var crosshair = document.getElementById('crosshair')
    crosshair.style.left = ((x + 1) / 2 * 100) + "%";
    crosshair.style.top = (100 - (y / 2 * 100)) + "%";

    // Forwards movement
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

    // Jumping movement
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

  // Now we need to figure out whether we're grabbing something.
  // This should only work if we're highlighting a block; otherwise
  // we have nothing to grab.
  if (!this.state.grabbing && fingers.length <= 1 && grabVoxelPosition && hands.length >= 1) {
    this.state.grabbing = true;
    game.setBlock(grabVoxelPosition, 0);
  } else if (this.state.grabbing && fingers.length >= 4) {
    this.state.grabbing = false;
  }

  if (!window.f) window.f = frame;
});

highlighter = highlight(game, {
  highlightVector: function() {
    return game.cameraVector()
  },
  animate: true
})

highlighter.on('highlight', function(positionArray) {
  grabVoxelPosition = positionArray
})

highlighter.on('remove', function(positionArray) {
  grabVoxelPosition = null
})

game.on('tick', leapControls.tick.bind(leapControls));

window.game = game; // for debugging
