// drawing signals ultimately comes down to drawing lines between points
// drawLine() assumes ctx has been configured
/* function drawLine( ctx, startPoint, endPoint, color = 'magenta' ) {
	ctx.beginPath()
		ctx.moveTo( startPoint.x, startPoint.y )
		ctx.lineTo( endPoint.x, endPoint.y )
		ctx.strokeStyle = color
		ctx.stroke()
} */

import ReplicatorView from '../../source/visualization/replicator-view'
import Replic8or from '../../source/simulation/replic8or'

describe( 'replicator view', () => {
	/* it( 'draws neuron signals', () => {
		const replicator = Replic8or()
		const view = ReplicatorView( replicator )
		
		spyOn( internals, 'drawLine' )
		
		view.neuronViews[0].position = { x: -10, y: 0 } // dead left
		view.neuronViews[1].position = { x:  10, y: 0 } // dead right
		
		view.neuronViews[0].neuron.fire( 0 )
		view.neuronViews[0].neuron.update(  )
		
		view.drawSignals()
		
		
		
		// expect( internals.drawLine ).toHaveBeenCalledWith( ... )
	} ) */
	
	it( 'confines neuron views', () => {
	
	} )
	
	it( 'uses the same indexes for flipper neurons and their views', () => {
		const replicator = Replic8or( { numBodySegments: 3 } )
		const replicatorView = ReplicatorView( replicator )
		
		const flippers = replicator.flippers
		const neuronViews = replicatorView.neuronViews
		
		expect( flippers.length ).toBe( 3 )
		
		for ( let flipper of flippers ) {
			const neuronView = neuronViews[ flipper.neuron.index ]
			expect( neuronView.neuron ).toBe( flipper.neuron )
		}
	} )
} )
