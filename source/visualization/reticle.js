// TODO refactor
// TODO inner ring

import Math2 from '../engine/math-2'

export default function Reticle() {
	let interimPosition = { x: 0, y: 0 }
	let interimRadius = 1
	let interimOpacity = 1
	
	let angle = 0
	let angle2 = 0
	let bias = 0
	
	return {
		position: { x: 0, y: 0 },
		radius: 1,
		
		doFocusEffect( fromRadius ) {
			angle = 0
			angle2 = 0
			bias = 0
			
			interimRadius = fromRadius
			interimOpacity = 0
		},
		
		doBlurEffect( fromRadius ) {
			// ...
		},
		
		update( dt ) {
			const p1 = this.position
			const p2 = interimPosition
			
			p2.x += ( p1.x - p2.x ) * 19 * dt
			p2.y += ( p1.y - p2.y ) * 19 * dt
			
			interimRadius += ( this.radius - interimRadius ) * 19 * dt
			interimOpacity += ( 1 - interimOpacity ) * 19 * dt
			if ( interimOpacity > 1 ) interimOpacity = 1
			
			angle = ( angle + Math.PI * 0.6 * dt ) % Math.PI
			angle2 = ( angle2 + Math.PI * 2 * 0.075 * dt ) % ( Math.PI * 2 )
			bias = ( 1 + Math.cos( angle ) ) * 0.5
		},
		
		draw( ctx, camera ) {
			const globalAlpha = ctx.globalAlpha
			const globalCompositeOperation = ctx.globalCompositeOperation
			
			const color = interpolateRgba( [ 255, 127, 0, 0.85 ], [ 255, 69, 0, 0.85 ], 1 - bias )
			const zoom = camera.zoomLevel()
			const p = interimPosition
			const tau = Math.PI * 2
			
			ctx.translate( p.x, p.y )
			ctx.rotate( angle2 )
			
			// middle ring
			{
				const innerRadius = interimRadius +  4 * zoom
				const outerRadius = interimRadius + 23 * zoom
				
				const gap = Math.PI / 23
				
				ctx.beginPath()
					ctx.arc( 0, 0, innerRadius, 0 + gap, Math.PI - gap )
					ctx.arc( 0, 0, outerRadius, Math.PI - gap, 0 + gap, true )
					
					ctx.arc( 0, 0, innerRadius, Math.PI + gap, Math.PI * 2 - gap )
					ctx.arc( 0, 0, outerRadius, Math.PI * 2 - gap, Math.PI + gap, true )
					
					ctx.globalAlpha *= 0.4
					ctx.fillStyle = color
					ctx.fill()
					ctx.globalAlpha /= 0.4
				
				ctx.beginPath()
					ctx.arc( 0, 0, innerRadius, 0 + gap, Math.PI - gap )
					
					ctx.strokeStyle = color
					ctx.lineWidth = 1.5
					ctx.globalAlpha *= 0.6
					ctx.stroke()
					ctx.globalAlpha /= 0.6
				
				ctx.beginPath()
					ctx.arc( 0, 0, innerRadius, Math.PI + gap, Math.PI * 2 - gap )
					
					ctx.strokeStyle = color
					ctx.lineWidth = 1.5
					ctx.globalAlpha *= 0.6
					ctx.stroke()
					ctx.globalAlpha /= 0.6
				
				ctx.beginPath()
					ctx.moveTo( Math.cos( 0 + gap ) * outerRadius, Math.sin( 0 + gap ) * outerRadius )
					ctx.lineTo( Math.cos( 0 + gap ) * innerRadius, Math.sin( 0 + gap ) * innerRadius )
					
					ctx.moveTo( Math.cos( Math.PI - gap ) * innerRadius, Math.sin( Math.PI - gap ) * innerRadius )
					ctx.lineTo( Math.cos( Math.PI - gap ) * outerRadius, Math.sin( Math.PI - gap ) * outerRadius )
					
					
					ctx.moveTo( Math.cos( Math.PI * 2 - gap ) * outerRadius, Math.sin( Math.PI * 2 - gap ) * outerRadius )
					ctx.lineTo( Math.cos( Math.PI * 2 - gap ) * innerRadius, Math.sin( Math.PI * 2 - gap ) * innerRadius )
					
					ctx.moveTo( Math.cos( Math.PI + gap ) * innerRadius, Math.sin( Math.PI + gap ) * innerRadius )
					ctx.lineTo( Math.cos( Math.PI + gap ) * outerRadius, Math.sin( Math.PI + gap ) * outerRadius )
					
					ctx.strokeStyle = color
					ctx.lineWidth = 1.5
					ctx.globalAlpha *= 0.6
					ctx.stroke()
					ctx.globalAlpha /= 0.6
			}
			
			ctx.rotate( -angle2 )
			ctx.translate( -p.x, -p.y )
			
			{
				ctx.beginPath()
					const tau = Math.PI * 2
					const r2 = interimRadius + 22 * zoom + 11
					
					const minX = 0 + 11
					const minY = 0 + 11
					const maxX = ctx.canvas.width  - 11
					const maxY = ctx.canvas.height - 11
					
					for ( let angle = 0; angle < tau; angle += tau / 4 ) {
						ctx.moveTo( p.x + Math.cos( angle ) * ( r2 + 5 ), p.y + Math.sin( angle ) * ( r2 + 5 ) )
						ctx.lineTo( Math2.clamp( p.x + Math.cos( angle ) * 1000, minX, maxX ), Math2.clamp( p.y + Math.sin( angle ) * 1000, minY, maxY ) )
					}
					
					ctx.globalAlpha *= 0.6
					ctx.strokeStyle = color
					ctx.lineWidth = 3
					ctx.stroke()
					ctx.globalAlpha /= 0.6
			}
			
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
