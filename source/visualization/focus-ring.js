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

export default function FocusRing() {
	const moveSpeed = 19
	const sizeSpeed = 19
	const rotateSpeed = 0.075
	
	let currentPosition = { x: 0, y: 0 }
	let targetPosition  = { x: 0, y: 0 }
	
	let currentRadius = 1
	let targetRadius  = 1
	
	let currentOpacity = 0
	let targetOpacity  = 0
	
	let angle = 0
	
	return {
		doFocusEffect( position, radius ) {
			currentPosition.x = targetPosition.x = position.x
			currentPosition.y = targetPosition.y = position.y
			
			currentRadius = radius * 2
			targetRadius  = radius
			
			currentOpacity = 0
			targetOpacity  = 1
			
			angle = 0
		},
		
		doBlurEffect() {
			targetRadius = currentRadius * 2
			targetOpacity = 0
		},
		
		moveTo( position ) {
			targetPosition.x = position.x
			targetPosition.y = position.y
		},
		
		sizeTo( radius ) {
			targetRadius = radius
		},
		
		update( dt_real ) {
			// smoothly transition from current to target
			currentPosition.x += ( targetPosition.x - currentPosition.x ) * moveSpeed * dt_real
			currentPosition.y += ( targetPosition.y - currentPosition.y ) * moveSpeed * dt_real
			currentRadius  += ( targetRadius  - currentRadius  ) * sizeSpeed * dt_real
			currentOpacity += ( targetOpacity - currentOpacity ) * sizeSpeed * dt_real
			
			// slowly rotate focus ring
			const tau = Math.PI * 2
			angle = ( angle + ( tau * rotateSpeed * dt_real ) ) % tau
		},
		
		draw( ctx, camera ) {
			ctx.savePartial( 'fillStyle', 'globalAlpha', 'lineWidth', 'strokeStyle' )
			
			ctx.globalAlpha = currentOpacity
			
			ctx.translate( currentPosition.x, currentPosition.y )
			ctx.rotate( angle )
			
			const zoom = camera.zoomLevel()
			const innerRadius = currentRadius +  4 * zoom
			const outerRadius = currentRadius + 23 * zoom
			const gap = Math.PI / 23
			
			const bias = ( angle / ( Math.PI * 2 ) * 8 ) % 1 // 0..1
			// if you change these colors, update boundary color in world view, active button color in control bar
			const color = interpolateRgba( [ 255, 127, 0, 0.85 ], [ 255, 69, 0, 0.85 ], bias )
			
			// top and bottom arcs
			
			ctx.globalAlpha *= 0.4
			ctx.fillStyle = color
			
			// top arc
			ctx.beginPath()
				ctx.arc( 0, 0, innerRadius, Math.PI + gap, Math.PI * 2 - gap )
				ctx.arc( 0, 0, outerRadius, Math.PI * 2 - gap, Math.PI + gap, true )
				ctx.fill()
			
			// bottom arc
			ctx.beginPath()
				ctx.arc( 0, 0, innerRadius, 0 + gap, Math.PI - gap )
				ctx.arc( 0, 0, outerRadius, Math.PI - gap, 0 + gap, true )
				ctx.fill()
			
			ctx.globalAlpha /= 0.4
			
			// outlines
			
			ctx.strokeStyle = color
			ctx.lineWidth = 1.5
			ctx.globalAlpha *= 0.6
			
			ctx.beginPath()
				// top outline
				ctx.moveTo( Math.cos( Math.PI + gap ) * outerRadius, Math.sin( Math.PI + gap ) * outerRadius )
				ctx.lineTo( Math.cos( Math.PI + gap ) * innerRadius, Math.sin( Math.PI + gap ) * innerRadius )
				ctx.arc( 0, 0, innerRadius, Math.PI + gap, Math.PI * 2 - gap )
				ctx.lineTo( Math.cos( Math.PI * 2 - gap ) * outerRadius, Math.sin( Math.PI * 2 - gap ) * outerRadius )
				
				// bottom outline
				ctx.moveTo( Math.cos( 0 + gap ) * outerRadius, Math.sin( 0 + gap ) * outerRadius )
				ctx.lineTo( Math.cos( 0 + gap ) * innerRadius, Math.sin( 0 + gap ) * innerRadius )
				ctx.arc( 0, 0, innerRadius, 0 + gap, Math.PI - gap )
				ctx.lineTo( Math.cos( Math.PI - gap ) * outerRadius, Math.sin( Math.PI - gap ) * outerRadius )
				
				ctx.stroke()
			
			ctx.rotate( -angle )
			ctx.translate( -currentPosition.x, -currentPosition.y )
			
			// cross hairs
			ctx.beginPath()
				const padding = 12
				
				// left
				{
					const x1 = 0 + padding
					const x2 = currentPosition.x - outerRadius - padding
					
					if ( x2 - x1 > 0 ) {
						ctx.moveTo( x1, currentPosition.y )
						ctx.lineTo( x2, currentPosition.y )
					}
				}
				
				// right
				{
					const x1 = currentPosition.x + outerRadius + padding
					const x2 = ctx.canvas.width - padding
					
					if ( x2 - x1 > 0 ) {
						ctx.moveTo( x1, currentPosition.y )
						ctx.lineTo( x2, currentPosition.y )
					}
				}
				
				// top
				{
					const y1 = 0 + padding
					const y2 = currentPosition.y - outerRadius - padding
					
					if ( y2 - y1 > 0 ) {
						ctx.moveTo( currentPosition.x, y1 )
						ctx.lineTo( currentPosition.x, y2 )
					}
				}
				
				// bottom
				{
					const y1 = currentPosition.y + outerRadius + padding
					const y2 = ctx.canvas.height - padding
					
					if ( y2 - y1 > 0 ) {
						ctx.moveTo( currentPosition.x, y1 )
						ctx.lineTo( currentPosition.x, y2 )
					}
				}
				
				ctx.stroke()
			
			ctx.restorePartial()
		},
	}
}
