import Network from './neural-network'
import Neuron  from './neuron'

const precision = 9

describe( 'neural network', () => {
	it( 'accepts new neurons', () => {
		const network = Network()
		
		const neuron = Neuron()
		network.addNeuron( neuron )
		
		expect( network.neurons.includes( neuron ) ).toBe( true )
	} )
	
	it( 'sets index property on new neurons', () => {
		const network = Network()
		
		const neuron = Neuron()
		network.addNeuron( neuron )
		
		expect( network.neurons[ neuron.index ] ).toBe( neuron )
	} )
	
	it( 'automatically adds weights to/for new neurons', () => {
		const network = Network()
		
		const neuronA = Neuron()
		network.addNeuron( neuronA )
		
		// A should now have a weight for itself
		expect( neuronA.index in neuronA.weights ).toBe( true )
		
		const neuronB = Neuron()
		network.addNeuron( neuronB )
		
		// A should now have a weight for B
		expect( neuronB.index in neuronA.weights ).toBe( true )
		// B should now have weights for A, B
		expect( neuronA.index in neuronB.weights ).toBe( true )
		expect( neuronB.index in neuronB.weights ).toBe( true )
	} )
	
	it( "doesn't overwrite existing weights", () => {
		const network = Network()
		
		const neuron = Neuron()
		neuron.weights = [ 0.9 ]
		network.addNeuron( neuron )
		
		expect( neuron.weights[ 0 ] ).toBe( 0.9 )
	} )
	
	it( 'propagates neuron signals', () => {
		const network = Network()
		
		const neuronOpts = {
			potentialDecayRate: 0,
			refractoryPeriod:   1,
		}
		
		const neuronA = Neuron( neuronOpts )
		network.addNeuron( neuronA )
		
		const neuronB = Neuron( neuronOpts )
		neuronB.weights[ neuronA.index ] = 1 // A excites B
		network.addNeuron( neuronB )
		
		neuronA.potential = 1
		network.update( 0 ) // A begins firing
		network.update( 0.25 ) // A fires for 1/4 seconds
		
		expect( neuronA.potential ).toBeCloseTo( 1 - 0.25, precision )
		expect( neuronB.potential ).toBeCloseTo( 0 + 0.25, precision )
	} )
	
	it( "doesn't propagate signals to originators", () => {
		const network = Network()
		
		const neuron = Neuron( { potentialDecayRate: 0, refractoryPeriod: 1 } )
		network.addNeuron( neuron )
		neuron.weights[ neuron.index ] = 1
		
		neuron.fire()
		network.update( 1/60 )
		
		expect( neuron.potential ).toBeCloseTo( 1 - 1/60, precision )
	} )
	
	it( 'adjusts signal strength per refractory period', () => {
		const network = Network()
		
		const neuronOpts = {
			potentialDecayRate: 0,
		}
		
		const neuronA = Neuron( neuronOpts )
		network.addNeuron( neuronA )
		
		const neuronB = Neuron( neuronOpts )
		neuronB.weights[ neuronA.index ] = 1 // A excites B
		network.addNeuron( neuronB )
		
		neuronA.refractoryPeriod = 0.5
		neuronA.fire()
		network.update( 0.25 )
		
		// A should be halfway done
		expect( neuronA.potential ).toBeCloseTo( 1 - 0.5, precision )
		expect( neuronB.potential ).toBeCloseTo( 0 + 0.5, precision )
	} )
} )

xdescribe( 'Hebbian learning', () => {
	it( '', () => {
		
	} )
} )

// WIP
describe( 'weight normalization', () => {
	// returns the largest absolute value from a list of numbers
	function maxAbs( ...numbers ) {
		return Math.max( ...numbers.map( x => Math.abs( x ) ) )
	}

	let normalizeWeights = function ( weights ) {
		// second argument ensures always >= 1
		const maxWeightAbs = maxAbs( ...weights, 1 )
		
		return weights.map( w => w * 1/maxWeightAbs )
	}

	let normalizeWeightsAcrossNeurons = function ( neurons ) {
		let maxWeightAbs = 1
		
		// ...
		
		for ( const neuron of neurons ) {
			neuron.weights = normalizeWeights( neuron.weights, maxWeightAbs )
		}
	}
	
	// --------
	
	// weights within range
	it( '[ -0.5, 0.5 ] -> [ -0.5, 0.5 ]', () => {
		const weights = normalizeWeights( [ -0.5, 0.5 ] )
		
		expect( weights[ 0 ] ).toBeCloseTo( -0.5, precision, 'w0' )
		expect( weights[ 1 ] ).toBeCloseTo(  0.5, precision, 'w1' )
	} )
	
	// weights at boundaries of range
	it( '[ -1, 1 ] -> [ -1, 1 ]', () => {
		const weights = normalizeWeights( [ -1, 1 ] )
		
		expect( weights[ 0 ] ).toBeCloseTo( -1, precision, 'w0' )
		expect( weights[ 1 ] ).toBeCloseTo(  1, precision, 'w1' )
	} )
	
	// positive weight exceeds range
	it( '[ 1, 2 ] -> [ 0.5, 1 ]', () => {
		const weights = normalizeWeights( [ 1, 2 ] )
		
		expect( weights[ 0 ] ).toBeCloseTo( 0.5, precision, 'w0' )
		expect( weights[ 1 ] ).toBeCloseTo( 1.0, precision, 'w1' )
	} )
	
	// negative weight exceeds range
	it( '[ -2, -1 ] -> [ -1, -0.5 ]', () => {
		const weights = normalizeWeights( [ -2, -1 ] )
		
		expect( weights[ 0 ] ).toBeCloseTo( -1.0, precision, 'w0' )
		expect( weights[ 1 ] ).toBeCloseTo( -0.5, precision, 'w1' )
	} )
	
	// positive and negative weights exceed range
	it( '[ -2, 4 ] -> [ -0.25, 1 ]', () => {
		const weights = normalizeWeights( [ -2, 4 ] )
		
		console.log(weights)
		
		expect( weights[ 0 ] ).toBeCloseTo( -0.5, precision, 'w0' )
		expect( weights[ 1 ] ).toBeCloseTo(  1.0, precision, 'w1' )
	} )
	
	// make sure zeroes are handled
	it( '[ 0, 2 ] -> [ 0, 2 ]', () => {
		const weights = normalizeWeights( [ 0, 2 ] )
		
		expect( weights[ 0 ] ).toBeCloseTo( 0, precision, 'w0' )
		expect( weights[ 1 ] ).toBeCloseTo( 1, precision, 'w1' )
	} )
} )
