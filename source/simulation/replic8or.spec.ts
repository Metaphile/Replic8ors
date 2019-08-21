import Replic8or from './replic8or'
import Network   from './neural-network'
import Neuron    from './neuron'

const precision = 9

// TODO test that inhibited potential decays

describe( 'replicator', () => {
	describe( 'replication', () => {
		xit( 'replicates', () => {
			
		} )
		
		it( 'automatically replicates when its stomach is full', () => {
			const replicator = Replic8or()
			
			spyOn( replicator, 'replicate' )
			
			replicator.energy = 1
			replicator.update( 0, 0 )
			
			expect( replicator.replicate ).toHaveBeenCalled()
		} )
	} )
	
	// turns out the radial symmetry logic also correctly handles bilateral symmetry
	// TODO should really test with 2 segments :/
	describe( 'radial/lateral symmetry', () => {
		it( 'maintains symmetric neuron weights', () => {
			const numSegments = 3
			const neuronsPerSegment = 2
			
			const network = Network()
			for ( let i = 0; i < numSegments * neuronsPerSegment; i++ )
				network.addNeuron( Neuron() )
			
			const neurons = network.neurons
			
			// weights for segment 0
			const weights_s0n0 = [ 0.00, 0.01,  0.02, 0.03,  0.04, 0.05 ]
			const weights_s0n1 = [ 0.10, 0.11,  0.12, 0.13,  0.14, 0.15 ]
			
			// expected weights for segment 1
			const weights_s1n2 = [ 0.04, 0.05,  0.00, 0.01,  0.02, 0.03 ]
			const weights_s1n3 = [ 0.10, 0.11,  0.12, 0.13,  0.14, 0.15 ]
			
			neurons[0].weights = weights_s0n0
			neurons[1].weights = weights_s0n1
			
			Replic8or.syncSymmetricWeights( neurons, numSegments, neuronsPerSegment )
			
			expect( neurons[2].weights ).toEqual( weights_s1n2 )
			// expect( neurons[3].weights ).toEqual( weights_s1n3 )
		} )
		
		it( 'syncs free neuron weights differently', () => {
			const numSegments = 3
			const numNeuronsPerSegment = 1
			const numNeurons = numSegments * numNeuronsPerSegment
			
			const network = Network()
			
			for ( let n = numNeurons; n > 0; n-- ) {
				network.addNeuron( Neuron() )
			}
			
			const freeNeuron = Neuron()
			network.addNeuron( freeNeuron )
			
			freeNeuron.weights[ 0 ] = 0.1
			freeNeuron.weights[ freeNeuron.index ] = 0.2
			
			Replic8or.syncSymmetricWeights( network.neurons, numSegments, numNeuronsPerSegment )
			
			expect( freeNeuron.weights ).toEqual( [ 0.1, 0.1, 0.1, 0.2 ] )
		} )
		
		it( 'maintains symmetric neuron decay rates', () => {
			const numSegments = 3
			const neuronsPerSegment = 2
			
			const network = Network()
			const numNeurons = numSegments * neuronsPerSegment
			for ( let n = numNeurons; n > 0; n-- )
				network.addNeuron( Neuron() )
			
			const neurons = network.neurons
			
			// first segment
			neurons[0].potentialDecayRate =  0.2
			neurons[1].potentialDecayRate = -0.1
			
			Replic8or.syncSymmetricWeights( neurons, numSegments, neuronsPerSegment )
			
			// second segment
			expect( neurons[2].potentialDecayRate ).toEqual(  0.2 )
			expect( neurons[3].potentialDecayRate ).toEqual( -0.1 )
			
			// third segment
			expect( neurons[4].potentialDecayRate ).toEqual(  0.2 )
			expect( neurons[5].potentialDecayRate ).toEqual( -0.1 )
		} )
		
		it( 'passes neuron decay rate to offspring', () => {
			const parent = Replic8or( { numBodySegments: 3 } )
			
			parent.brain.neurons[0].potentialDecayRate = 0.1
			const child = parent.replicate( false, 0 )
			
			expect( child.brain.neurons[0].potentialDecayRate ).toBe( 0.1 )
		} )
	} )
	
	it( 'uses energy over time', () => {
		const replicator = Replic8or( {
			energy:     0.5,
			metabolism: 1.0, // loss per second
		} )
		
		replicator.update( 1/60 )
		
		// ~0.483
		expect( replicator.energy ).toBeCloseTo( 0.5 - 1/60, precision )
	} )
	
	it( 'has a maximum energy capacity', () => {
		const replicator = Replic8or()
		
		replicator.energy = 2 // 200%
		replicator.update( 0, 0 )
		
		expect( replicator.energy <= 1 ).toBe( true )
	} )
	
	it( 'dies if it runs out of energy', () => {
		const replicator = Replic8or()
		const spy = jasmine.createSpy()
		replicator.on( 'died', spy )
		
		replicator.energy = 0
		replicator.update( 1/60 )
		
		expect( spy ).toHaveBeenCalled()
		
		// TODO
		// const replicator = Replic8or()
		//
		// expect( replicator.dead ).toBe( false )
		//
		// replicator.energy = 0
		// replicator.update( 1/60 )
		//
		// expect( replicator.dead ).toBe( true )
	} )
	
	xit( 'flagella push replicator in opposite direction', () => {
		const replicator = Replic8or( {
			metabolism:  0,
			numSegments: 3,
		} )
		
		// ...
	} )
	
	it( 'releases event handlers when it dies', () => {
		const replicator = Replic8or()
		
		const onDied = jasmine.createSpy()
		replicator.on( 'died', onDied )
		
		const onFlipping = jasmine.createSpy()
		replicator.flippers[0].on( 'flipping', onFlipping )
		
		const onFire = jasmine.createSpy()
		replicator.brain.neurons[0].on( 'fire', onFire )
		
		replicator.die()
		
		replicator.emit( 'died' )
		replicator.flippers[0].emit( 'flipping' )
		replicator.brain.neurons[0].emit( 'fire' )
		
		expect( onDied ).toHaveBeenCalledTimes( 1 )
		expect( onFlipping ).not.toHaveBeenCalled()
		expect( onFire ).not.toHaveBeenCalled()
	} )
} )
