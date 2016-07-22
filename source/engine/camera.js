const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' )

export default function Camera( ctx ) {
	const self = {}
	
	// maps points FROM world space TO screen space
	let screenMatrix = svg.createSVGMatrix()
	// maps points FROM screen space TO world space
	let worldMatrix = screenMatrix.inverse()
	
	self.ctx = ctx
	const canvas = self.ctx.canvas
	
	self.pan = ( dx, dy ) => {
		if ( dx instanceof Object ) { dy = dx.y; dx = dx.x }
		
		screenMatrix = screenMatrix.translate( -dx, -dy )
		worldMatrix  = screenMatrix.inverse()
	}
	
	self.zoom = ( zoomDelta, centerX, centerY ) => {
		if ( centerX instanceof Object ) { centerY = centerX.y; centerX = centerX.x }
		
		screenMatrix = screenMatrix
			.translate( centerX, centerY )
			.scale( 1 + zoomDelta, 1 + zoomDelta )
			.translate( -centerX, -centerY )
		
		worldMatrix = screenMatrix.inverse()
	}
	
	self.zoomTo = ( zoomLevel, centerX, centerY ) => {
		if ( centerX instanceof Object ) { centerY = centerX.y; centerX = centerX.x }
		
		screenMatrix = screenMatrix.translate( centerX, centerY )
		// manually set X/Y scale
		screenMatrix.a = screenMatrix.d = zoomLevel
		screenMatrix = screenMatrix.translate( -centerX, -centerY )
		
		worldMatrix = screenMatrix.inverse()
	}
	
	// TODO use a property?
	// X scale (X/Y scale should be the same)
	self.getZoomLevel = () => screenMatrix.a
	
	// TODO -> getOffset
	self.centerOfView = () => {
		const topLeft = self.toWorld( 0, 0 )
		const bottomRight = self.toWorld( canvas.width, canvas.height )
		
		const center = {}
		center.x = ( topLeft.x + bottomRight.x ) / 2
		center.y = ( topLeft.y + bottomRight.y ) / 2
		
		return center
	}
	
	self.toScreen = ( worldX, worldY ) => {
		if ( worldX instanceof Object ) { worldY = worldX.y; worldX = worldX.x }
		
		const p = svg.createSVGPoint()
		p.x = worldX
		p.y = worldY
		
		return p.matrixTransform( screenMatrix )
	}
	
	// TODO
	self.getDistance_screen = ( p1_world, p2_world ) => {
		
	}
	
	self.toWorld = ( screenX, screenY ) => {
		if ( screenX instanceof Object ) { screenY = screenX.y; screenX = screenX.x }
		
		const p = svg.createSVGPoint()
		p.x = screenX
		p.y = screenY
		
		return p.matrixTransform( worldMatrix )
	}
	
	self.prepareCanvas = () => {
		// fast clear canvas
		self.ctx.canvas.width = self.ctx.canvas.width
		
		const m = screenMatrix
		self.ctx.setTransform( m.a, m.b, m.c, m.d, m.e, m.f )
	}
	
	return self
}
