// if predator OR prey population is too large, stop spawning food particles
// prey will die, predators will die

// if predator population is endangered, spawn more food particles (how often?)
// prey will flourish, predators will flourish (hopefully)

// if predator population is extinct,
// ensure prey population isn't too small,
// repopulate to endangered from cryo/random

// if prey population is endangered, spawn more food particles
// UNLESS predator population is too large
// in that case, starve prey population to starve predator population
// prey population may drop to zero -- that's OK
// if prey population drops to zero, ensure predator population isn't too large
// remove all food particles
// add single dose of food
// repopulate to endangered from cryo/random

// to repopulate:
// start with empty cryo
// spawn N random replicators
// only when replicator manages to replicate, add perfect copy to cryo
// when more replicators needed,
// if cryo is empty, repopulate world with N random replicators
// if cryo is only partially full, repopulate world with imperfect clones + however many random replicators
// if cryo is full, repopulate world with imperfect clones from cryo
// possible problem: what if cryo becomes full of lucky bastards with horrible genetics whose clones never replicate?
// is that likely?

// need to enforce upper bound on food particles
// maybe just enough to support max population?

// a "dose" of food is enough to fully feed a minimum population
// give doses every N seconds until population is at or above minimum

// considering prey and food only:

// don't worry about all prey dying at once
// it's unlikely
// and we can handle it the same way as when prey die one at a time to extinction
// repopulate from cryo/random

// at beginning, create min prey population and add single dose of food
// when population drops below min, add dose every N seconds
// food particles do not expire, continually accumulate up to some max
// 

// when randomizing neuron weights in new replicators
// restrict weights to what could be achieved with mutation
// basically, imperfectly clone a blank network
// is that what I'm doing now?

// food should be plentiful but not worth much
// prey metabolisms should be higher since they have more opportunity to feed
// predator metabolisms should be lower because they have less opportunity to feed

// separate neurons for hunger and fullness

// instead of min/max population
// just have ... normal population
// single value
// if population is below normal, add food periodically
// if population is above normal, whithold food

// add eat neuron
// when prey is in contact with one or more food particles
// and eat neuron fires
// prey eats all food particles
// else prey just pushes food particles around

// maybe when predators replicate, they make two clones

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
		expect( world.replicators.length ).toBe( 3 )
	} )
	
	describe( 'when the last replicator dies', () => {
		it( 'removes leftover food', () => {
			const world = World()
			const scenario = Scenario( world, { numReplicators: 1 } )
			
			world.addFood( Food() )
			world.addFood( Food() )
			expect( world.foods.length ).toBe( 2 )
			
			world.replicators[ 0 ].die()
			expect( world.foods.length ).toBe( 0 )
		} )
		
		it( 'adds more replicators', () => {
			const world = World()
			const scenario = Scenario( world, { numReplicators: 3 } )
			
			world.replicators[ 0 ].die()
			expect( world.replicators.length ).toBe( 2 )
			
			world.replicators[ 0 ].die() // 1 left
			world.replicators[ 0 ].die() // 0 left
			expect( world.replicators.length ).toBe( 3 )
		} )
	} )
} )
