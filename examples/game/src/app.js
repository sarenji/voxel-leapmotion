var createGame = require('voxel-engine');
var texturePath = require('painterly-textures');
var player = require('voxel-player');
var voxel = require('voxel');
var controls = require('../../../');

var chunkSize = 16
var chunkDistance = 2
var roomSize = 16

var game = createGame({
  chunkSize: chunkSize,
  chunkDistance: chunkDistance,
  texturePath: texturePath('examples/game'),
  // generateVoxelChunk: generator,
  // generate: voxel.generator['Checker'],
  generate: function(i, j, k) {
    var number = (i % roomSize) * (j % roomSize) * (k % roomSize);
    return number > 0 ? 0 : 1;
  },
  controls: { discreteFire: true }
});

game.appendTo(document.body);

var createPlayer = player(game);
var avatar = createPlayer();
avatar.possess();
// avatar.yaw.position.set(2, 100, 4);
avatar.yaw.position.set(6, 6, 6);

var tickControls = controls({game: game});
tickControls.on('hand', function(frame, hand) {

});
game.on('tick', function(dt) {
  tickControls.tick(dt);
});

window.game = game; // for debugging
