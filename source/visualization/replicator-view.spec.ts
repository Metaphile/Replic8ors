import ReplicatorView, { getSignalParts, SignalPart, SignalPartType } from './replicator-view'
import Replic8or from '../simulation/replic8or'
import Vector2 from '../engine/vector-2'

describe( 'replicator view', () => {
	function expectSignalParts( actualParts, expectedParts ) {
		const precision = 9
		
		expect( actualParts.length ).toBe( expectedParts.length, 'num parts' )
		
		for ( let i = 0; i < expectedParts.length; i++ ) {
			for ( const key in expectedParts[ i ] ) {
				const actualValue = actualParts[ i ][ key ]
				const expectedValue = expectedParts[ i ][ key ]
				
				if ( typeof expectedValue === 'number' ) {
					expect( actualValue ).toBeCloseTo( expectedValue, precision, `[${i}].${key}` )
				} else {
					expect( actualValue ).toBe( expectedValue )
				}
			}
		}
	}
	
	describe( 'getSignalParts()', () => {
		describe( 'signal hasn\'t changed', () => {
			it( ' 1.0  :  1.0  =>  | ++++++++++ |', () => {
				const weight = 1.0
				
				expectSignalParts( getSignalParts( weight, weight ), [
					{
						start: 0.0,
						end:   1.0,
						type:  SignalPartType.ExcitatoryUnchanged,
					},
				] )
			} )
			
			it( '-1.0  : -1.0  =>  | ---------- |', () => {
				const weight = -1.0
				
				expectSignalParts( getSignalParts( weight, weight ), [
					{
						start: 0.0,
						end:   1.0,
						type:  SignalPartType.InhibitoryUnchanged,
					},
				] )
			} )
			
			it( ' 0.0  :  0.0  =>  | -----+++++ |', () => {
				const weight = 0.0
				
				expectSignalParts( getSignalParts( weight, weight ), [
					{
						start: 0.0,
						end:   0.5,
						type:  SignalPartType.InhibitoryUnchanged,
					},
					{
						start: 0.5,
						end:   1.0,
						type:  SignalPartType.ExcitatoryUnchanged,
					},
				] )
			} )
			
			it( ' 0.4  :  0.4  =>  | ---+++++++ |', () => {
				const weight = 0.4
				
				expectSignalParts( getSignalParts( weight, weight ), [
					{
						start: 0.0,
						end:   0.3,
						type:  SignalPartType.InhibitoryUnchanged,
					},
					{
						start: 0.3,
						end:   1.0,
						type:  SignalPartType.ExcitatoryUnchanged,
					},
				] )
			} )
			
			it( '-0.6  : -0.6  =>  | --------++ |', () => {
				const weight = -0.6
				
				expectSignalParts( getSignalParts( weight, weight ), [
					{
						start: 0.0,
						end:   0.8,
						type:  SignalPartType.InhibitoryUnchanged,
					},
					{
						start: 0.8,
						end:   1.0,
						type:  SignalPartType.ExcitatoryUnchanged,
					},
				] )
			} )
		} )
		
		describe( 'signal has changed', () => {
			it( '-0.6 ->  0.4  =>  | ---#####++ |', () => {
				expectSignalParts( getSignalParts( -0.6, 0.4 ), [
					{
						start: 0.0,
						end:   0.3,
						type:  SignalPartType.InhibitoryUnchanged,
					},
					{
						start: 0.3,
						end:   0.8,
						type:  SignalPartType.ExcitatoryGained,
					},
					{
						start: 0.8,
						end:   1.0,
						type:  SignalPartType.ExcitatoryUnchanged,
					},
				] )
			} )
			
			it( ' 0.6 -> -0.4  =>  | --=====+++ |', () => {
				expectSignalParts( getSignalParts( 0.6, -0.4 ), [
					{
						start: 0.0,
						end:   0.2,
						type:  SignalPartType.InhibitoryUnchanged,
					},
					{
						start: 0.2,
						end:   0.7,
						type:  SignalPartType.InhibitoryGained,
					},
					{
						start: 0.7,
						end:   1.0,
						type:  SignalPartType.ExcitatoryUnchanged,
					},
				] )
			} )
			
			it( ' 1.0 -> -1.0  =>  | ========== |', () => {
				expectSignalParts( getSignalParts( 1.0, -1.0 ), [
					{
						start: 0.0,
						end:   1.0,
						type:  SignalPartType.InhibitoryGained,
					},
				] )
			} )
			
			it( '-1.0 ->  1.0  =>  | ########## |', () => {
				expectSignalParts( getSignalParts( -1.0, 1.0 ), [
					{
						start: 0.0,
						end:   1.0,
						type:  SignalPartType.ExcitatoryGained,
					},
				] )
			} )
		} )
	} )
	
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
