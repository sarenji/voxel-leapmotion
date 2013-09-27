var createGame = require('voxel-engine');
var texturePath = require('painterly-textures');
var player = require('voxel-player');
var voxel = require('voxel');
var terrain = require('voxel-simplex-terrain');

var chunkSize = 32
var chunkDistance = 2
var generator = terrain({scaleFactor: 10, chunkDistance: chunkDistance});

// the returned function is for getting specific chunks
var chunkData = generator([0,0,0], [32,32,32]);

var game = createGame({
  texturePath: texturePath('./'),
  generateVoxelChunk: generator,
  worldOrigin: [0, 0, 0],
  startingPosition: [0, 3000, 1000],
  controls: { discreteFire: true }
});

var createPlayer = player(game);
var avatar = createPlayer();
avatar.possess();
avatar.yaw.position.set(2, 100, 4);

game.appendTo(document.body);

window.game = game; // for debugging
