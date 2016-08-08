// for the most part, coordinate args should be in worldspace
// toWorld() takes screenspace coordinates, obvs

// you can have multiple cameras per canvas
//
// worldCamera.applyView( ctx1 )
// draw world...
//
// hudCamera.applyView( ctx1 )
// draw HUD...

// for working with SVG matrices and points
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
			
			screenMatrix.e = -x * screenMatrix.a // a == x scale
			screenMatrix.f = -y * screenMatrix.d // d == y scale
			
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
				// put origin back
				// if dz != 0, origin will be closer or farther away
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
		
		// when you need to know how far left/right/up/down the camera can see on a given canvas
		// a.k.a. view frustum
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
			// x scale (x/y scale should be the same)
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
			const { a, b, c, d, e, f } = screenMatrix
			ctx.setTransform( a, b, c, d, e, f )
		},
	}
}
