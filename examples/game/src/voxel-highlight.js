var inherits = require('inherits')
var events = require('events')
var _ = require('underscore')

module.exports = Highlighter

function Highlighter(game, opts) {
  if (!(this instanceof Highlighter)) return new Highlighter(game, opts)
  this.game = game
  opts = opts || {}
  var geometry = this.geometry = opts.geometry || new game.THREE.CubeGeometry(1, 1, 1)
  var material = opts.material || new game.THREE.MeshBasicMaterial({
    color: opts.color || 0x000000,
    wireframe: true,
    wireframeLinewidth: opts.wireframeLinewidth || 3,
    transparent: true,
    opacity: opts.wireframeOpacity || 0.5
  })
  this.mesh = new game.THREE.Mesh(geometry, material)
  this.distance = opts.distance || 10
  this.currVoxelPos // undefined when no voxel selected for highlight
  this.currVoxelAdj // undefined when no adjacent voxel selected for highlight
  this.targetPosition // desired position of highlight cube center
  
  // the adjacent highlight will be active when the following returns true
  this.adjacentActive = opts.adjacentActive || function () { return game.controls.state.alt }
  
  // the selection highlight will be active when the following returns true
  this.selectActive = opts.selectActive || function () { return game.controls.state.select }

  this.highlightVector = opts.highlightVector || function() { return game.cameraVector() }
  
  // animate highlight transitions?
  this.animate = opts.animate
  this.animateFunction = opts.animateFunction || function (position, targetPosition, deltaTime) {
    if (!position || !targetPosition || !deltaTime) return;
    var rate = 10
    if (Math.abs(targetPosition[0] - position[0]) < 0.05
     && Math.abs(targetPosition[1] - position[1]) < 0.05
     && Math.abs(targetPosition[2] - position[2]) < 0.05) {
      return targetPosition // close enough to snap and be done
    }
    deltaTime = deltaTime / 1000 // usually around .016 seconds (60 FPS)
    position[0] += rate * deltaTime * (targetPosition[0] - position[0])
    position[1] += rate * deltaTime * (targetPosition[1] - position[1])
    position[2] += rate * deltaTime * (targetPosition[2] - position[2])
    return position
  }

  // highlight 'easing' animation, called every tick if enabled
  var self = this
  if (this.animate) game.on('tick', function (dt) {
    var position = [self.mesh.position.x, self.mesh.position.y, self.mesh.position.z]
    position = self.animateFunction(position, self.targetPosition, dt)
    if (position) self.mesh.position.set(position[0], position[1], position[2])
  })

  game.on('tick', _.throttle(this.highlight.bind(this), opts.frequency || 100))
  
  // anchors for multi-voxel selection
  this.selectStart
  this.selectEnd
}

inherits(Highlighter, events.EventEmitter)

Highlighter.prototype.highlight = function () {

  var cp = this.game.cameraPosition()
  var cv = this.highlightVector()
  var hit = this.game.raycastVoxels(cp, cv, this.distance)
  var targetPositionCandidate

  var removeAdjacent = function (self) { // remove adjacent highlight if any
    if (!self.currVoxelAdj) return;
    self.emit('remove-adjacent', self.currVoxelAdj)
    self.currVoxelAdj = undefined
  }

  // remove existing highlight if any
  if (!hit) {
    if (!this.currVoxelPos) return; // already removed
    this.game.scene.remove(this.mesh)
    this.emit('remove', this.currVoxelPos.slice())
    this.currVoxelPos = undefined
    removeAdjacent(this)
    return;
  }

  var newVoxelPos = hit.voxel
  if (!this.currVoxelPos
    || newVoxelPos[0] !== this.currVoxelPos[0]
    || newVoxelPos[1] !== this.currVoxelPos[1]
    || newVoxelPos[2] !== this.currVoxelPos[2]) { // no current highlight or it moved

    if (this.currVoxelPos) {
      this.emit('remove', this.currVoxelPos.slice()) // moved highlight
    }
    else {
      this.game.scene.add(this.mesh) // fresh highlight
    }
    this.emit('highlight', newVoxelPos.slice())
    this.currVoxelPos = newVoxelPos.slice()
  }
  // try to set the position every time, it may be overridden below
  targetPositionCandidate = [this.currVoxelPos[0] + 0.5, this.currVoxelPos[1] + 0.5, this.currVoxelPos[2] + 0.5]

  // if in "adjacent" mode, highlight adjacent voxel instead
  if (this.adjacentActive()) {
    // since we got here, we know we have a selected non-empty voxel
    // and with an empty adjacent voxel that we can work with
    var newVoxelAdj = hit.adjacent
    if (!this.currVoxelAdj
      || newVoxelAdj[0] !== this.currVoxelAdj[0]
      || newVoxelAdj[1] !== this.currVoxelAdj[1]
      || newVoxelAdj[2] !== this.currVoxelAdj[2]) { // no current adj highlight or it has moved
  
      if (this.currVoxelAdj) {
        this.emit('remove-adjacent', this.currVoxelAdj.slice()) // moved adjacent highlight
      }
      this.emit('highlight-adjacent', newVoxelAdj.slice())
      
      this.currVoxelAdj = newVoxelAdj.slice()
    }
    targetPositionCandidate = [this.currVoxelAdj[0] + 0.5, this.currVoxelAdj[1] + 0.5, this.currVoxelAdj[2] + 0.5]
  }
  else removeAdjacent(this)

  // if in "select" mode, track start and end voxel bounds
  if (this.selectActive()) {
    if (!this.selectStart) { // start a new selection
      this.selectStart = this.selectEnd = this.currVoxelAdj || this.currVoxelPos
    }
    else {
      var endCandidate = this.currVoxelAdj || this.currVoxelPos
      if (endCandidate[0] !== this.selectEnd[0]
       || endCandidate[1] !== this.selectEnd[1]
       || endCandidate[2] !== this.selectEnd[2]) { 
         
        this.selectEnd = endCandidate // selection end has changed
        
        this.emit('highlight-select', { start: this.selectStart.slice(), end: this.selectEnd.slice() })
        
        var scale = []
        scale[0] = Math.abs(this.selectEnd[0] - this.selectStart[0]) + 1
        scale[1] = Math.abs(this.selectEnd[1] - this.selectStart[1]) + 1
        scale[2] = Math.abs(this.selectEnd[2] - this.selectStart[2]) + 1
        this.mesh.scale.set(scale[0], scale[1], scale[2])
        
        var pos = []
        pos[0] = this.selectStart[0] + 0.5 + (this.selectEnd[0] - this.selectStart[0]) / 2
        pos[1] = this.selectStart[1] + 0.5 + (this.selectEnd[1] - this.selectStart[1]) / 2
        pos[2] = this.selectStart[2] + 0.5 + (this.selectEnd[2] - this.selectStart[2]) / 2
        this.targetPosition = pos
      }
    }
  }
  else {
    if (this.selectStart) {
      this.emit('highlight-deselect', { start: this.selectStart.slice(), end: this.selectEnd.slice() })
      this.selectStart = null
      this.mesh.scale.set(1, 1, 1)
    }
    this.targetPosition = targetPositionCandidate // highlighted voxel or adjacent
  }
  if (!this.animate) this.mesh.position.set(this.targetPosition[0], this.targetPosition[1], this.targetPosition[2])
}
