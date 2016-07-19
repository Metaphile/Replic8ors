// TODO almost made a breaking change to the foods-replicators loop
// maybe write a test that fails if this.foods.length isn't checked per iteration

import World from '../../source/simulation/world'
import Replic8or from '../../source/simulation/replic8or'
import Food from '../../source/simulation/food'
import Vector2 from '../../source/engine/vector-2'

const precision = 9

describe( 'world', () => {
	it( 'replicators can be added', () => {
		const world = World()
		
		const replicator = Replic8or()
		world.addReplicator( replicator )
		
		expect( world.replicators.includes( replicator ) ).toBe( true )
	} )
	
	it( 'removes expired food', () => {
		const world = World()
		
		const food = Food()
		world.addFood( food )
		food.spoil()
		
		expect( world.foods.includes( food ) ).toBe( false )
	} )
	
	it( 'feeds replicators that touch food', () => {
		const world = World()
		
		const replicatorA = Replic8or( { radius: 50, energy: 0.5, metabolism: 0 } )
		const replicatorB = Replic8or( { radius: 50, energy: 0.5, metabolism: 0 } )
		const food = Food( { radius: 10, calories: 0.1 } )
		
		world.addReplicator( replicatorA )
		world.addReplicator( replicatorB )
		world.addFood( food )
		
		food.position = { x: 0, y: 0 }
		
		replicatorA.position = { x: 1000, y: 0 } // far away
		replicatorB.position = { x: 10 + 50 - 1, y: 0 } // barely touching food
		
		world.update( 0, 0 )
		
		// should be the same
		expect( replicatorA.energy ).toBeCloseTo( 0.5, precision )
		// should be more
		expect( replicatorB.energy ).toBeCloseTo( 0.5 + 0.1, precision )
		// should be gone
		expect( world.foods.includes( food ) ).toBe( false )
	} )
	
	it( 'divvies up food in the case of a tie', () => {
		const world = World()
		
		const replicatorA = Replic8or( { energy: 0.3, metabolism: 0 } )
		const replicatorB = Replic8or( { energy: 0.5, metabolism: 0 } )
		const food = Food( { calories: 0.2 } )
		
		world.addReplicator( replicatorA )
		world.addReplicator( replicatorB )
		world.addFood( food )
		
		replicatorA.position = { x: 0, y: 0 }
		replicatorB.position = { x: 0, y: 0 }
		food.position        = { x: 0, y: 0 }
		
		world.update( 0, 0 )
		
		expect( replicatorA.energy ).toBeCloseTo( 0.3 + 0.1, precision )
		expect( replicatorB.energy ).toBeCloseTo( 0.5 + 0.1, precision )
	} )
	
	it( 'removes dead replicators', () => {
		const world = World()
		
		const replicator = Replic8or()
		world.addReplicator( replicator )
		replicator.die()
		
		expect( world.replicators.length ).toBe( 0 )
	} )
	
	it( 'moves partially overlapping replicators apart', () => {
		const world = World()
		
		// TODO it sucks to have to specify all this here
		// but it would also suck to have a bunch of tests that assume certain defaults
		const replConfig = {
			radius:     64,
			energy:     0.5,
			metabolism: 0,
			mass:       10,
			drag:       1,
		}
		
		// position two replicators so that they're overlapping horizontally
		
		const lefty = Replic8or( replConfig )
		lefty.position.x = -10
		
		const righty = Replic8or( replConfig )
		righty.position.x = 10
		
		world.addReplicator( lefty )
		world.addReplicator( righty )
		
		world.update( 1/60, 1/60 )
		
		// expect lefty to be lefter, righty to be righter
		expect( lefty.position.x  < -10 ).toBe( true )
		expect( righty.position.x >  10 ).toBe( true )
	} )
	
	it( 'moves completely overlapping replicators apart', () => {
		const world = World()
		
		const replConfig = {
			radius:     64,
			energy:     0.5,
			metabolism: 0,
			mass:       10,
			drag:       1,
		}
		
		// position two replicators so that they're directly on top of each other
		
		const bottom = Replic8or( replConfig )
		const top    = Replic8or( replConfig )
		
		world.addReplicator( bottom )
		world.addReplicator( top )
		
		world.update( 1/60, 1/60 )
		
		const error = Math.pow( 10, -precision )
		
		expect( Vector2.getLength( top.position ) > error ).toBe( true )
		expect( Vector2.getLength( bottom.position ) > error ).toBe( true )
		// TODO make sure replicators moved in opposite directions
	} )
	
	describe( 'emits events', () => {
		it( 'replicator added', () => {
			const world = World()
			
			const spy = jasmine.createSpy()
			world.on( 'replicator-added', spy )
			
			const replicator = Replic8or()
			world.addReplicator( replicator )
			
			expect( spy ).toHaveBeenCalledWith( replicator )
		} )
		
		it( 'replicator died', () => {
			const world = World()
			
			const spy = jasmine.createSpy()
			world.on( 'replicator-died', spy )
			
			const doomedReplicator = Replic8or()
			world.addReplicator( doomedReplicator )
			doomedReplicator.die()
			
			expect( spy ).toHaveBeenCalledWith( doomedReplicator )
		} )
		
		it( 'food added', () => {
			const world = World()
			
			const spy = jasmine.createSpy()
			world.on( 'food-added', spy )
			
			const food = Food()
			world.addFood( food )
			
			expect( spy ).toHaveBeenCalledWith( food )
		} )
		
		xit( 'food eaten', () => {
			const world = World()
			
			const spy = jasmine.createSpy()
			world.on( 'food-eaten', spy )
			
			const food = Food()
			world.addFood( food )
			food.chomp()
			
			expect( spy ).toHaveBeenCalledWith( food )
		} )
		
		it( 'food spoiled', () => {
			const world = World()
			
			const spy = jasmine.createSpy()
			world.on( 'food-spoiled', spy )
			
			const food = Food()
			world.addFood( food )
			food.spoil()
			
			expect( spy ).toHaveBeenCalledWith( food )
		} )
	} )
} )
