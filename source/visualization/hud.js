export default function Hud( camera ) {
	const self = {}
	
	self.drawFocusRing = ( center_world, radius_world, animationProgress = 0 ) => {
		const center_hud = camera.toScreen( center_world )
		
		const edge_world = {
			x: center_world.x + radius_world,
			y: center_world.y
		}
		const edge_hud = camera.toScreen( edge_world )
		
		const radius_hud = edge_hud.x - center_hud.x
		
		// ...
	}
	
	self.drawOffscreenIndicator = ( direction, color = 'orange', size = '5' ) => {
		
	}
	
	return self
}
