import Vector2 from '../engine/vector-2'

export function drawConnections( ctx, neuronViews, detail = 1 ) {
	for ( let i = 0, n = neuronViews.length; i < n; i++ ) {
		const neuronViewA = neuronViews[i]
		
		for ( let j = i + 1; j < n; j++ ) {
			drawConnectionPair( ctx, neuronViewA, neuronViews[j], detail )
		}
	}
	
	ctx.globalAlpha = 1
}

function drawConnectionPair( ctx, neuronViewA, neuronViewB, detail = 1 ) {
	if ( neuronViewA.neuron.firing ) {
		const weight = neuronViewB.neuron.weights[ neuronViewA.neuron.index ]
		drawConnection( ctx, neuronViewA.position, neuronViewA.radius, neuronViewB.position, neuronViewB.radius, weight, 1 - neuronViewA.neuron.potential, Math.max( neuronViewA.connectionOpacity, neuronViewB.connectionOpacity ) )
	}
	
	if ( neuronViewB.neuron.firing ) {
		const weight = neuronViewA.neuron.weights[ neuronViewB.neuron.index ]
		drawConnection( ctx, neuronViewB.position, neuronViewB.radius, neuronViewA.position, neuronViewA.radius, weight, 1 - neuronViewB.neuron.potential, Math.max( neuronViewA.connectionOpacity, neuronViewB.connectionOpacity ) )
	}
}

// TODO when detail is low, don't use alpha
export function drawConnection( ctx, pointA, radiusA, pointB, radiusB, weight, progress, baseOpacity ) {
	if ( Math.abs( weight ) < 0.001 ) return
	
	const vectorA_B = Vector2.subtract( pointB, pointA, {} )
	const angleA_B = Vector2.angle( vectorA_B )
	const angleB_A = angleA_B + Math.PI
	
	const minConnWidth = Math.PI * 0.01
	const maxConnWidth = Math.PI * 0.09
	
	let offsetB = minConnWidth
	offsetB += Math.abs( weight ) * Math.pow( 1 - progress, 2 ) * ( maxConnWidth - minConnWidth )
	
	const pointB1 = Vector2.clone( pointB )
	pointB1.x += Math.cos( angleB_A + offsetB ) * radiusB
	pointB1.y += Math.sin( angleB_A + offsetB ) * radiusB
	
	const pointB2 = Vector2.clone( pointB )
	pointB2.x += Math.cos( angleB_A - offsetB ) * radiusB
	pointB2.y += Math.sin( angleB_A - offsetB ) * radiusB
	
	
	const vectorA_B1 = Vector2.subtract( pointB1, pointA, {} )
	const angleA_B1 = Vector2.angle( vectorA_B1 )
	const offsetA = angleA_B1 - angleA_B
	
	const pointA1 = Vector2.clone( pointA )
	pointA1.x += Math.cos( angleA_B + offsetA ) * radiusA
	pointA1.y += Math.sin( angleA_B + offsetA ) * radiusA
	
	const pointA2 = Vector2.clone( pointA )
	pointA2.x += Math.cos( angleA_B - offsetA ) * radiusA
	pointA2.y += Math.sin( angleA_B - offsetA ) * radiusA
	
	ctx.fillStyle = weight < 0 ? 'rgba( 190,   0,   0, 0.666 )' : 'rgba(  90, 195, 255, 1.0 )'
	
	const gco = ctx.globalCompositeOperation
	if ( weight < 0 ) ctx.globalCompositeOperation = 'darken'
	else ctx.globalCompositeOperation = 'lighten'
	
	ctx.beginPath()
		ctx.moveTo( pointA1.x, pointA1.y )
		ctx.lineTo( pointB1.x, pointB1.y )
		ctx.lineTo( pointB2.x, pointB2.y )
		ctx.lineTo( pointA2.x, pointA2.y )
		
		const ga = ctx.globalAlpha
		ctx.globalAlpha = baseOpacity * Math.pow( 1 - progress, 1 )
		ctx.fill()
		ctx.globalAlpha = ga
	
	ctx.globalCompositeOperation = gco
}
