// TODO -> CameraController

import Vector2 from '../engine/vector-2'
import Math2 from '../engine/math-2'

const MIN_ZOOM = 0.6, MAX_ZOOM = 18

export default function CameraOperator( camera, canvas ) {
	const self = {}
	
	self.camera = camera
	
	let zoomBuffer = 0
	
	// gently bob camera
	let bobAngle = 0
	
	// let target = null
	let offset = { x: 0, y: 0 }
	
	self.smoothPan = ( dx, dy ) => {
		if ( dx instanceof Object ) { dy = dx.y; dx = dx.x }
		
		offset.x += dx
		offset.y += dy
	}
	
	// TODO implement smoothness; consolidate with smoothZoomTo
	self.smoothZoom = ( zoomDelta, zoomX, zoomY ) => {
		if ( zoomX instanceof Object ) { zoomY = zoomX.y; zoomX = zoomX.x; }
		
		var oldZoom = camera.zoomLevel()
		// TODO enforce in update()
		var newZoom = Math2.clamp( oldZoom * ( 1 + zoomDelta ), MIN_ZOOM, MAX_ZOOM )
		
		var oldCenter = camera.viewCenter( canvas )
		camera.zoomTo( newZoom, zoomX, zoomY )
		var newCenter = camera.viewCenter( canvas )
		Vector2.subtract( offset, Vector2.subtract( oldCenter, newCenter ) )
	}
	
	self.smoothZoomTo = ( zoomLevel, zoomX, zoomY ) => {
		camera.zoomTo( zoomLevel, zoomX, zoomY )
	}
	
	self.follow = ( target ) => {
		self.target = target
		
		const viewCenter = camera.viewCenter( canvas )
		offset.x = viewCenter.x - target.position.x
		offset.y = viewCenter.y - target.position.y
	}
	
	self.unfollow = () => {
		self.target = null
		
		const viewCenter = camera.viewCenter( canvas )
		offset.x = viewCenter.x
		offset.y = viewCenter.y
	}
	
	self.update = ( dt, dt2 ) => {
		const viewCenter = camera.viewCenter( canvas )
		
		// pseudo-random camera bob
		// pauses with simulation
		if ( dt2 ) {
			bobAngle = ( bobAngle + 0.21 * dt2 ) % ( Math.PI * 2 )
			
			var m = 1.875 * dt2
			offset.x += Math.cos( bobAngle *  7 ) * m
			offset.y += Math.sin( bobAngle * 13 ) * m
		}
		
		// move camera toward target + offset
		if ( true ) {
			var targetX = 0, targetY = 0
			
			if ( self.target ) {
				targetX = self.target.position.x
				targetY = self.target.position.y
			}
			
			var px = targetX + offset.x
			var py = targetY + offset.y
			
			// adjust position more aggressively while zooming
			// var speed = 5.1 * ( 1 + Math.abs( this._zoomBuffer * 1.1 ) );
			var speed = 5.6
			
			camera.pan(
				( px - viewCenter.x ) * speed * dt,
				( py - viewCenter.y ) * speed * dt
			)
		}
		
		// zoom
		// if ( zoomBuffer ) {
		// 	var oldZoom = camera.getZoomLevel()
		// 	camera.zoom( zoomBuffer * 4.8 * dt, viewCenter.x, viewCenter.y )
		// 	zoomBuffer += oldZoom - camera.getZoomLevel()
		// }
	}
	
	return self
}
