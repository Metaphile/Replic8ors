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
