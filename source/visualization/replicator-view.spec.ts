import ReplicatorView from './replicator-view'
import Replic8or from '../simulation/replic8or'
import Vector2 from '../engine/vector-2'

describe( 'replicator view', () => {
	it( 'confines neuron views', () => {
		const replicator = Replic8or( { radius: 32 } )
		const replicatorView = ReplicatorView( replicator )
		const someNeuronView = replicatorView.neuronViews[ 0 ]
		
		// yank replicator to the right
		replicator.position.x = 999
		
		// expect (any) neuron view to be outside the replicator
		expect( Vector2.distance( someNeuronView.position, replicator.position ) ).toBeGreaterThan( 32 )
		
		// do confinement
		replicatorView.update( 0, 0 )
		
		// expect neuron view to be inside the replicator
		expect( Vector2.distance( someNeuronView.position, replicator.position ) ).toBeLessThan( 32 )
	} )
	
	it( 'uses the same indexes for flipper neurons and their views', () => {
		const replicator = Replic8or( { numBodySegments: 3 } )
		const replicatorView = ReplicatorView( replicator )
		
		const flippers = replicator.flippers
		const neuronViews = replicatorView.neuronViews
		
		expect( flippers.length ).toBe( 3 )
		
		for ( const flipper of flippers ) {
			const neuronView = neuronViews[ flipper.neuron.index ]
			expect( neuronView.neuron ).toBe( flipper.neuron )
		}
	} )
} )
