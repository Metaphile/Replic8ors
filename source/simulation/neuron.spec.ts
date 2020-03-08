// TODO test for default source index

import Neuron from './neuron'

// for floating point comparison
const precision = 9
const error = Math.pow( 10, -precision )

describe( 'neuron', () => {
	it( 'excitatory/inhibitory input increases/decreases neuron potential', () => {
		const neuron = Neuron()
		const excitatoryIndex = 0
		const inhibitoryIndex = 1
		neuron.weights[ excitatoryIndex ] =  1.0
		neuron.weights[ inhibitoryIndex ] = -1.0
		
		neuron.stimulate( 1/60, excitatoryIndex )
		neuron.update( 0 )
		expect( neuron.potential > error ).toBe( true, 'excitatory' )
		
		neuron.potential = 0.9
		neuron.stimulate( 1/60, inhibitoryIndex )
		neuron.update( 0 )
		expect( neuron.potential < 0.9 - error ).toBe( true, 'inhibitory' )
	} )
	
	it( 'threshold potential activates neuron', () => {
		const neuron = Neuron()
		
		neuron.potential = 0.9
		neuron.update( 1/60 )
		expect( neuron.firing ).toBe( false )
		
		neuron.potential = 1.0
		neuron.update( 1/60 )
		expect( neuron.firing ).toBe( true )
	} )
	
	it( 'takes a specific amount of time to fire', () => {
		const neuron = Neuron( { refractoryPeriod: 0.25 } )
		
		neuron.potential = 1.0
		neuron.update( 14/60 ) // just less than 1/4 sec
		expect( neuron.firing ).toBe( true )
		
		neuron.update( 1/60 + error )
		expect( neuron.firing ).toBe( false )
	} )
	
	it( 'neuron ignores input while firing', () => {
		const neuron = Neuron( { refractoryPeriod: 1.0 } )
		const sourceIndex = 0
		neuron.weights[ sourceIndex ] = 1.0
		neuron.potential = 1.0
		
		neuron.update( 1/60 )
		neuron.stimulate( 1/60, sourceIndex )
		neuron.update( 1/60 )
		expect( neuron.potential ).toBeCloseTo( 1.0 - 2/60, precision )
	} )
	
	it( 'neuron potential returns to zero after firing', () => {
		const neuron = Neuron( { refractoryPeriod: 1.0 } )
		neuron.potential = 1.0
		
		neuron.update( 60/60 + error )
		expect( neuron.potential ).toBeCloseTo( 0, precision )
	} )
	
	it( 'neuron potential decays over time', () => {
		const neuron = Neuron( { potentialDecayRate: 0.5 } )
		
		neuron.potential = 0.9
		neuron.update( 1/60 )
		expect( neuron.potential < 0.9 - error ).toBe( true )
	} )
	
	// TODO broken by input scaling
	xit( 'neuron tracks inhibitory input', () => {
		const neuron = Neuron()
		const sourceIndex = 0
		neuron.weights[ sourceIndex ] = -1.0
		
		neuron.stimulate( 0.1, sourceIndex )
		expect( neuron.inhibitoryInput ).toBeCloseTo( 0.1, precision )
	} )
	
	it( 'neuron activation resets inhibitory input', () => {
		const neuron = Neuron()
		
		neuron.inhibitoryInput = 0.5
		neuron.fire()
		
		expect( neuron.inhibitoryInput ).toBeCloseTo( 0, precision )
	} )
	
	it( 'emits fire event', () => {
		const neuron = Neuron()
		
		const spy = jasmine.createSpy()
		neuron.on( 'fire', spy )
		
		neuron.potential = 1.0
		neuron.update( 0 )
		
		expect( spy ).toHaveBeenCalled()
	} )
	
	it( 'potential >= 0', () => {
		const neuron = Neuron()
		
		const sourceIndex = 0
		neuron.weights[ sourceIndex ] = -1
		
		neuron.stimulate( 0.5, sourceIndex )
		neuron.update( 0 )
		
		expect( neuron.potential >= 0 ).toBe( true )
	} )
} )
