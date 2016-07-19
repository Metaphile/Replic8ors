import NeuronView from '../../source/visualization/neuron-view'

const precision = 9
const error = Math.pow( 10, -precision )

describe( 'neuron view', () => {
	it( 'lags behind its anchor point', () => {
		const neuronView = NeuronView( { clinginess: 1 } )
		
		neuronView.anchor = { x: 4, y: -3 }
		neuronView.update( 1/60, 1/60 )
		
		// expect neuron view to be (roughly) between its anchor point and starting position
		expect( neuronView.position.x >  error     ).toBe( true )
		expect( neuronView.position.x <  4 - error ).toBe( true )
		
		expect( neuronView.position.y < -error ).toBe( true )
	} )
} )
