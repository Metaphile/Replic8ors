export default function FocusRing() {
	let apparentRadius = 1
	let apparentOpacity = 1
	
	let angle = 0
	let bias = 0
	
	return {
		position: { x: 0, y: 0 },
		radius: 1,
		
		doFocusEffect( fromRadius ) {
			apparentRadius = fromRadius
			apparentOpacity = 0
		},
		
		moveTo( position ) {
			Object.assign( this.position, position )
			angle = 0
			bias = 0
		},
		
		update( dt ) {
			apparentRadius += ( this.radius - apparentRadius ) * 17 * dt
			apparentOpacity += ( 1 - apparentOpacity ) * 17 * dt
			if ( apparentOpacity > 1 ) apparentOpacity = 1
			
			angle = ( angle + Math.PI * 0.6 * dt ) % Math.PI
			bias = ( 1 + Math.cos( angle ) ) * 0.5
		},
		
		draw( ctx, camera ) {
			const globalAlpha = ctx.globalAlpha
			const globalCompositeOperation = ctx.globalCompositeOperation
			
			const z = camera.zoomLevel()
			const tau = Math.PI * 2
			
			ctx.globalAlpha = 0.8 * apparentOpacity
			// ctx.globalCompositeOperation = 'lighten'
			
			const p = this.position
			const r1 = ( apparentRadius + 18 ) * camera.zoomLevel()
			const r2 = r1 + 22
			
			const color = interpolateRgba( [ 255, 127, 0, 0.85 ], [ 255, 69, 0, 0.85 ], 1 - bias )
			
			ctx.beginPath()
				ctx.arc( p.x, p.y, r1, 0, tau )
				ctx.arc( p.x, p.y, r2, 0, tau, true )
				
				ctx.fillStyle = color
				ctx.fill()
			
			ctx.beginPath()
				for ( let angle = 0; angle < tau; angle += tau / 4 ) {
					ctx.moveTo( p.x + Math.cos( angle ) * ( r2 + 5 ), p.y + Math.sin( angle ) * ( r2 + 5 ) )
					ctx.lineTo( p.x + Math.cos( angle ) * r2 * 20,  p.y + Math.sin( angle ) * r2 * 20 )
				}
				
				ctx.strokeStyle = color
				ctx.lineWidth = 2
				ctx.stroke()
			
			ctx.globalAlpha = globalAlpha
			ctx.globalCompositeOperation = globalCompositeOperation
		},
	}
}

function interpolate( startValue, endValue, bias ) {
	return startValue + ( endValue - startValue ) * bias
}

function interpolateRgba( rgba1, rgba2, bias ) {
	const rgba3 = []
	
	for ( let i = 0; i < rgba1.length; i++ ) {
		rgba3[ i ] = Math.round( interpolate( rgba1[ i ], rgba2[ i ], bias ) )
	}
	
	const [ r, g, b, a ] = rgba3
	return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
}
