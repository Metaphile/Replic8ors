import Vector2 from '../engine/vector-2'

export function drawConnections( ctx, neuronViews, detail = 1 ) {
	for ( let i = 0, n = neuronViews.length; i < n; i++ ) {
		const neuronViewI = neuronViews[i]
		
		for ( let j = i + 1; j < n; j++ ) {
			const neuronViewJ = neuronViews[j]
			
			if ( neuronViewI.neuron.firing ) {
				drawConnection(
					ctx,
					neuronViewI.position,
					neuronViewI.radius,
					neuronViewJ.position,
					neuronViewJ.radius,
					neuronViewJ.neuron.weights[ neuronViewI.neuron.index ],
					1 - neuronViewI.neuron.potential,
					Math.max( neuronViewI.connectionOpacity, neuronViewJ.connectionOpacity ) )
			}
			
			if ( neuronViewJ.neuron.firing ) {
				drawConnection(
					ctx,
					neuronViewJ.position,
					neuronViewJ.radius,
					neuronViewI.position,
					neuronViewI.radius,
					neuronViewI.neuron.weights[ neuronViewJ.neuron.index ],
					1 - neuronViewJ.neuron.potential,
					Math.max( neuronViewI.connectionOpacity, neuronViewJ.connectionOpacity ) )
			}
		}
	}
	
	ctx.globalAlpha = 1
}

// TODO when detail is low, don't use alpha
export function drawConnection( ctx, a_center, a_radius, b_center, b_radius, weight, progress, baseOpacity ) {
	const excitatoryStyle = 'rgba( 90, 195, 255, 1.0 )'
	const inhibitoryStyle = 'rgba( 190, 0, 0, 0.666 )'
	const minConnWidth = 0
	const maxConnWidth = 0.25
	
	// vector from a center to b center
	const ab_displacement = Vector2.subtract( b_center, a_center, {} )
	const ab_distance = Vector2.distance( a_center, b_center )
	
	// angle from a center to b center
	const ab_angle = Vector2.angle( ab_displacement )
	// flip 180 degrees
	const ba_angle = ab_angle + Math.PI
	
	
	const b_edgeOffset = minConnWidth + Math.abs( weight ) * ( maxConnWidth - minConnWidth )
	
	const b_edge1 = Vector2.clone( b_center )
	b_edge1.x += Math.cos( ba_angle + b_edgeOffset ) * b_radius
	b_edge1.y += Math.sin( ba_angle + b_edgeOffset ) * b_radius
	
	const b_edge2 = Vector2.clone( b_center )
	b_edge2.x += Math.cos( ba_angle - b_edgeOffset ) * b_radius
	b_edge2.y += Math.sin( ba_angle - b_edgeOffset ) * b_radius
	
	
	const a_edgeOffset = Vector2.angle( Vector2.subtract( b_edge1, a_center, {} ) ) - ab_angle
	
	const a_edge1 = Vector2.clone( a_center )
	a_edge1.x += Math.cos( ab_angle + a_edgeOffset ) * a_radius
	a_edge1.y += Math.sin( ab_angle + a_edgeOffset ) * a_radius
	
	const a_edge2 = Vector2.clone( a_center )
	a_edge2.x += Math.cos( ab_angle - a_edgeOffset ) * a_radius
	a_edge2.y += Math.sin( ab_angle - a_edgeOffset ) * a_radius
	
	
	const midpoint_distance = a_radius + ( ab_distance - a_radius - b_radius ) * Math.pow( progress, 1/4 )
	
	const midpoint = Vector2.clone( a_center )
	midpoint.x += Math.cos( ab_angle ) * midpoint_distance
	midpoint.y += Math.sin( ab_angle ) * midpoint_distance
	
	
	const ctx_globalAlpha = ctx.globalAlpha
	const ctx_globalCompositeOperation = ctx.globalCompositeOperation
	
	ctx.globalAlpha = baseOpacity * Math.pow( 1 - progress, 1 )
	ctx.globalCompositeOperation = weight < 0 ? 'darken' : 'lighten'
	
	ctx.fillStyle = weight < 0 ? inhibitoryStyle : excitatoryStyle
	
	ctx.beginPath()
		// draw triangle with base at neuron A edge, tip at midpoint
		ctx.moveTo( a_edge1.x, a_edge1.y )
		ctx.lineTo( a_edge2.x, a_edge2.y )
		ctx.lineTo( midpoint.x, midpoint.y )
		ctx.closePath()
		
		// draw triangle from neuron B edge to midpoint
		ctx.moveTo( b_edge1.x, b_edge1.y )
		ctx.lineTo( b_edge2.x, b_edge2.y )
		ctx.lineTo( midpoint.x, midpoint.y )
		ctx.closePath()
		
		ctx.fill()
	
	ctx.globalAlpha = ctx_globalAlpha
	ctx.globalCompositeOperation = ctx_globalCompositeOperation
}
