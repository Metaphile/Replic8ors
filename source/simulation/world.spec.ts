// TODO almost made a breaking change to the foods-replicators loop
// maybe write a test that fails if this.foods.length isn't checked per iteration

import World from './world'
import Prey from './prey'
import Food from './food'
import Vector2 from '../engine/vector-2'

const precision = 9

describe( 'world', () => {
	it( 'preys can be added', () => {
		const world = World()
		
		const prey = Prey()
		world.addPrey( prey )
		
		expect( world.preys.includes( prey ) ).toBe( true )
	} )
	
	it( 'removes expired food', () => {
		const world = World()
		
		const food = Food()
		world.addFood( food )
		food.spoil()
		
		expect( world.foods.includes( food ) ).toBe( false )
	} )
	
	it( 'feeds preys that touch food', () => {
		const world = World()
		
		const preyA = Prey( { radius: 50, energy: 0.5, metabolism: 0 } )
		const preyB = Prey( { radius: 50, energy: 0.5, metabolism: 0 } )
		const food = Food( { radius: 10, calories: 0.1 } )
		
		world.addPrey( preyA )
		world.addPrey( preyB )
		world.addFood( food )
		
		food.position = { x: 0, y: 0 }
		
		preyA.position = { x: 1000, y: 0 } // far away
		preyB.position = { x: 10 + 50 - 1, y: 0 } // barely touching food
		
		world.update( 0, 0 )
		
		// should be the same
		expect( preyA.energy ).toBeCloseTo( 0.5, precision )
		// should be more
		expect( preyB.energy ).toBeCloseTo( 0.5 + 0.1, precision )
		// should be gone
		expect( world.foods.includes( food ) ).toBe( false )
	} )
	
	it( 'divvies up food in the case of a tie', () => {
		const world = World()
		
		const preyA = Prey( { energy: 0.3, metabolism: 0 } )
		const preyB = Prey( { energy: 0.5, metabolism: 0 } )
		const food = Food( { calories: 0.2 } )
		
		world.addPrey( preyA )
		world.addPrey( preyB )
		world.addFood( food )
		
		preyA.position = { x: 0, y: 0 }
		preyB.position = { x: 0, y: 0 }
		food.position        = { x: 0, y: 0 }
		
		world.update( 0, 0 )
		
		expect( preyA.energy ).toBeCloseTo( 0.3 + 0.1, precision )
		expect( preyB.energy ).toBeCloseTo( 0.5 + 0.1, precision )
	} )
	
	it( 'removes dead preys', () => {
		const world = World()
		
		const prey = Prey()
		world.addPrey( prey )
		prey.die()
		
		expect( world.preys.length ).toBe( 0 )
	} )
	
	it( 'moves partially overlapping preys apart', () => {
		const world = World()
		
		const preyOpts = {
			radius:     64,
			energy:     0.5,
			metabolism: 0,
			mass:       10,
			drag:       1,
		}
		
		// position two preys so that they're overlapping horizontally
		
		const lefty = Prey( preyOpts )
		lefty.position.x = -10
		
		const righty = Prey( preyOpts )
		righty.position.x = 10
		
		world.addPrey( lefty )
		world.addPrey( righty )
		
		world.update( 1/60, 1/60 )
		
		// expect lefty to be lefter, righty to be righter
		expect( lefty.position.x  < -10 ).toBe( true )
		expect( righty.position.x >  10 ).toBe( true )
	} )
	
	it( 'moves completely overlapping preys apart', () => {
		const world = World()
		
		const preyOpts = {
			radius:     64,
			energy:     0.5,
			metabolism: 0,
			mass:       10,
			drag:       1,
		}
		
		// position two preys so that they're directly on top of each other
		
		const bottom = Prey( preyOpts )
		const top    = Prey( preyOpts )
		
		world.addPrey( bottom )
		world.addPrey( top )
		
		world.update( 1/60, 1/60 )
		
		const error = Math.pow( 10, -precision )
		
		expect( Vector2.getLength( top.position ) > error ).toBe( true )
		expect( Vector2.getLength( bottom.position ) > error ).toBe( true )
		// TODO make sure preys moved in opposite directions
	} )
	
	describe( 'emits events', () => {
		it( 'prey added', () => {
			const world = World()
			
			const spy = jasmine.createSpy()
			world.on( 'prey-added', spy )
			
			const prey = Prey()
			world.addPrey( prey )
			
			expect( spy ).toHaveBeenCalledWith( prey )
		} )
		
		it( 'prey died', () => {
			const world = World()
			
			const spy = jasmine.createSpy()
			world.on( 'prey-died', spy )
			
			const doomedPrey = Prey()
			world.addPrey( doomedPrey )
			doomedPrey.die()
			
			expect( spy ).toHaveBeenCalledWith( doomedPrey )
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
