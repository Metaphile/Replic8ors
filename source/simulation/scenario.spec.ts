import Scenario, { createPopulation } from './scenario'
import World from './world'
import Food from './food'
import Prey from './replic8or'

xdescribe( 'scenario', () => {
	// WIP
	describe( 'maintains prey population', () => {
		const minPrey =  5
		const maxPrey = 10
		
		let world, scenario
		
		beforeEach( () => {
			world = World()
			scenario = Scenario( world, {
				numReplicators:  0,
				numPredators:    0,
				minPreys:        2,
				maxPreys:        5,
			} )
		} )
		
		it( 'creates minimal population when population goes extinct', () => {
			scenario.minPreys = 1
			scenario.update( 0 )
			expect( scenario.world.preys.length ).toBe( scenario.minPreys )
		} )
		
		it( 'feeds small populations until they become large populations', () => {
			scenario.minPreys = scenario.maxPreys = 2
			
			scenario.addPrey( Prey() )
			scenario.update( 0 )
			expect( scenario.feeding ).toBeTruthy( 'population < min' )
			
			scenario.addPrey( Prey() )
			scenario.update( 0 )
			expect( scenario.feeding ).toBeTruthy( 'population within min/max' )
			
			scenario.addPrey( Prey() )
			scenario.update( 0 )
			expect( scenario.feeding ).toBeFalsy( 'population > max' )
		} )
		
		it( 'starves large populations until they become small populations', () => {
			scenario.minPreys = scenario.maxPreys = 2
			
			const prey1 = Prey()
			const prey2 = Prey()
			const prey3 = Prey()
			
			scenario
				.addPrey( prey1 )
				.addPrey( prey2 )
				.addPrey( prey3 )
			scenario.update( 0 )
			expect( scenario.feeding ).toBeFalsy( 'population > max' )
			
			scenario.removePrey( prey3 )
			scenario.update( 0 )
			expect( scenario.feeding ).toBeFalsy( 'population within max/min' )
			
			scenario.removePrey( prey2 )
			scenario.update( 0 )
			expect( scenario.feeding ).toBeTruthy( 'population < min' )
		} )
	} )
	
	it( 'adds replicators to the world', () => {
		const world = World()
		const scenario = Scenario( world, { numReplicators: 3 } )
		expect( world.preys.length ).toBe( 3 )
	} )
	
	describe( 'when the last replicator dies', () => {
		it( 'removes leftover food', () => {
			const world = World()
			const scenario = Scenario( world, { numReplicators: 1 } )
			
			world.addFood( Food() )
			world.addFood( Food() )
			expect( world.foods.length ).toBe( 2 )
			
			world.preys[ 0 ].die()
			expect( world.foods.length ).toBe( 0 )
		} )
		
		it( 'adds more replicators', () => {
			const world = World()
			const scenario = Scenario( world, { numReplicators: 3 } )
			
			world.preys[ 0 ].die()
			expect( world.preys.length ).toBe( 2 )
			
			world.preys[ 0 ].die() // 1 left
			world.preys[ 0 ].die() // 0 left
			expect( world.preys.length ).toBe( 3 )
		} )
	} )
} )
