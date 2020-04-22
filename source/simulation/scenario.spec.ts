import Scenario from './scenario'
import World from './world'
import Food from './food'
import Prey from './prey'
import Predator from './predator'

describe( 'scenario', () => {
	let world
	let scenario
	
	function addFoods( numFoods ) {
		while ( numFoods-- ) {
			world.addFood( Food() )
		}
	}
	
	function addPreys( numPreys ) {
		while ( numPreys-- ) {
			world.addPrey( Prey() )
		}
	}
	
	function addPredators( numPredators ) {
		while ( numPredators-- ) {
			world.addPredator( Predator() )
		}
	}
	
	beforeEach( () => {
		world = World()
		
		const scenarioOpts = {
			maxFoods:     10,
			maxPreys:     10,
			maxPredators: 10,
		}
		
		scenario = Scenario( world, scenarioOpts )
	} )
	
	describe( 'manages foods', () => {
		it( 'doesn\'t add foods when foods >= max', () => {
			addFoods( scenario.maxFoods )
			scenario.balancePopulations()
			
			expect( scenario.getNumFoods() ).toBe( scenario.maxFoods )
		} )
		
		it( 'adds foods when preys < max', () => {
			addPreys( scenario.maxPreys - 1 )
			scenario.balancePopulations()
			
			expect( scenario.getNumFoods() ).toBe( scenario.maxFoods )
		} )
		
		it( 'adds foods when predators AND preys < max', () => {
			addPreys( scenario.maxPreys - 1 )
			addPredators( scenario.maxPredators - 1 )
			scenario.balancePopulations()
			
			expect( scenario.getNumFoods() ).toBe( scenario.maxFoods )
		} )
		
		it( 'doesn\'t add foods when predators >= max, preys > 0', () => {
			addPreys( 1 )
			addPredators( scenario.maxPredators )
			
			expect( scenario.getNumFoods() ).toBe( 0 )
		} )
		
		it( 'adds foods when predators >= max, preys == 0', () => {
			addPredators( scenario.maxPredators )
			scenario.balancePopulations()
			
			expect( scenario.getNumFoods() ).toBe( scenario.maxFoods )
		} )
	} )
	
	describe( 'manages preys', () => {
		it( 'adds preys when preys == 0', () => {
			scenario.balancePopulations()
			expect( scenario.getNumPreys() ).toBe( scenario.maxPreys / 2 )
		} )
		
		it( 'doesn\'t add preys when predators >= max', () => {
			addPredators( scenario.maxPredators )
			scenario.balancePopulations()
			
			expect( scenario.getNumPreys() ).toBe( scenario.maxPreys / 2 )
		} )
	} )
	
	describe( 'manages predators', () => {
		it( 'adds predators when predators == 0', () => {
			scenario.balancePopulations()
			expect( scenario.getNumPredators() ).toBe( scenario.maxPredators / 2 )
		} )
	} )
} )
