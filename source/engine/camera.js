// you can have multiple cameras per canvas
//
// worldCamera.applyView( ctx1 )
// draw world...
//
// hudCamera.applyView( ctx1 )
// draw HUD...

// for working with SVG matrices and points
// I've never quite understood why the element needs to be namespaced
const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' )

export default function Camera() {
	// maps points FROM world space TO screen space
	let screenMatrix = svg.createSVGMatrix()
	// maps points FROM screen space TO world space
	let worldMatrix = screenMatrix.inverse()
	
	return {
		// relative
		pan( dx, dy ) {
			if ( dx instanceof Object ) { dy = dx.y; dx = dx.x }
			
			screenMatrix = screenMatrix.translate( -dx, -dy )
			worldMatrix = screenMatrix.inverse()
		},
		
		// absolute
		panTo( x, y ) {
			if ( x instanceof Object ) ( { x, y } = x )
			
			screenMatrix.e = -x * screenMatrix.a // x scale
			screenMatrix.f = -y * screenMatrix.d // y scale
			
			worldMatrix = screenMatrix.inverse()
		},
		
		// scale around point
		zoom( dz, x, y ) {
			if ( x instanceof Object ) ( { x, y } = x )
			
			screenMatrix = screenMatrix
				// move origin to zoom center
				.translate( x, y )
				// to increase zoom by e.g. 10%, scale by 1 + 0.1
				.scale( 1 + dz, 1 + dz )
				// translate origin so that zoom center is unmoved
				.translate( -x, -y )
			
			worldMatrix = screenMatrix.inverse()
		},
		
		zoomTo( z, x, y ) {
			if ( x instanceof Object ) ( { x, y } = x )
			
			screenMatrix = screenMatrix.translate( x, y )
			
			// manually set x/y scale
			screenMatrix.a = screenMatrix.d = z
			
			screenMatrix = screenMatrix.translate( -x, -y )
			worldMatrix = screenMatrix.inverse()
		},
		
		// view frustum is assumed to be axis-aligned
		viewBounds( canvas ) {
			const topLeft = this.toWorld( 0, 0 )
			const bottomRight = this.toWorld( canvas.width, canvas.height )
			
			return { topLeft, bottomRight }
		},
		
		viewCenter( canvas ) {
			const { topLeft, bottomRight } = this.viewBounds( canvas )
			
			const x = ( topLeft.x + bottomRight.x ) / 2
			const y = ( topLeft.y + bottomRight.y ) / 2
			
			return { x, y }
		},
		
		// TODO method to retrieve pan offset?
		
		zoomLevel() {
			// x scale
			// (x and y scale are assumed be the same)
			return screenMatrix.a
		},
		
		toScreen( x, y ) {
			if ( x instanceof Object ) ( { x, y } = x )
			
			const p = svg.createSVGPoint()
			p.x = x; p.y = y
			
			return p.matrixTransform( screenMatrix )
		},
		
		toWorld( x, y ) {
			if ( x instanceof Object ) ( { x, y } = x )
			
			const p = svg.createSVGPoint()
			p.x = x; p.y = y
			
			return p.matrixTransform( worldMatrix )
		},
		
		applyView( ctx ) {
			const m = screenMatrix
			ctx.setTransform( m.a, m.b, m.c, m.d, m.e, m.f )
		},
	}
}
