import {
	areCloserThan,
	forEachUniquePair,
	transferEnergyBetween,
} from './world-helpers'

describe( 'areCloserThan()', () => {
	let a, b
	
	beforeEach( () => {
		a = { position: { x: 0, y: 0 }, radius: 1 }
		b = { position: { x: 0, y: 0 }, radius: 1 }
	} )
	
	it( 'a and b directly on top of each other', () => {
		expect( areCloserThan( a, b, 0 ) ).toBe( true, 'distance === 0' )
		expect( areCloserThan( a, b, 1 ) ).toBe( true, 'distance === 1' )
	} )
	
	it( 'a and b partially overlapping', () => {
		a.position.y = -0.5
		b.position.y =  0.5
		
		expect( areCloserThan( a, b, 0 ) ).toBe( true, 'distance === 0' )
		expect( areCloserThan( a, b, 1 ) ).toBe( true, 'distance === 1' )
	} )
	
	it( 'a and b just touching', () => {
		a.position.x = -1
		b.position.x =  1
		
		expect( areCloserThan( a, b, 0 ) ).toBe( false, 'distance === 0' )
		expect( areCloserThan( a, b, 0.001 ) ).toBe( true, 'distance === 0.001' )
	} )
	
	it( 'a and b apart', () => {
		a.position.x = -5
		b.position.x =  5
		
		expect( areCloserThan( a, b, 0 ) ).toBe( false, 'distance === 0' )
		expect( areCloserThan( a, b, 10 ) ).toBe( true, 'distance === 10' )
	} )
} )

describe( 'forEachUniquePair()', () => {
	it( '[]', () => {
		const spy = jasmine.createSpy()
		forEachUniquePair( [], spy )
		
		expect( spy ).not.toHaveBeenCalled()
	} )
	
	it( '[ 1 ]', () => {
		const spy = jasmine.createSpy()
		forEachUniquePair( [ 1 ], spy )
		
		expect( spy ).not.toHaveBeenCalled()
	} )
	
	it( '[ 1, 2 ]', () => {
		const spy = jasmine.createSpy()
		forEachUniquePair( [ 1, 2 ], spy )
		
		expect( spy ).toHaveBeenCalledTimes( 1 )
		expect( spy.calls.argsFor( 0 ) ).toEqual( [ 1, 2 ] )
	} )
	
	it( '[ 1, 2, 3 ]', () => {
		const spy = jasmine.createSpy()
		forEachUniquePair( [ 1, 2, 3 ], spy )
		
		expect( spy ).toHaveBeenCalledTimes( 3 )
		expect( spy.calls.argsFor( 0 ) ).toEqual( [ 1, 2 ] )
		expect( spy.calls.argsFor( 1 ) ).toEqual( [ 1, 3 ] )
		expect( spy.calls.argsFor( 2 ) ).toEqual( [ 2, 3 ] )
	} )
} )

describe( 'transferEnergyBetween()', () => {
	const precision = 4
	const emit = () => {} // no-op
	
	it( 'zero transfer', () => {
		const startingEnergy = 0.5
		
		const food = { type: 'food', energy: startingEnergy, preyValue: 0.0, emit }
		const prey = { type: 'prey', energy: startingEnergy, foodValue: 0.0, emit }
		
		transferEnergyBetween( prey, food )
		
		expect( food.energy ).toBeCloseTo( startingEnergy, precision )
		expect( prey.energy ).toBeCloseTo( startingEnergy, precision )
	} )
	
	it( 'food <-> prey', () => {
		const food = { type: 'food', energy: 0.5, preyValue: -0.1, emit }
		const prey = { type: 'prey', energy: 0.5, foodValue:  0.1, emit }
		
		transferEnergyBetween( prey, food )
		
		expect( food.energy ).toBeCloseTo( 0.4, precision )
		expect( prey.energy ).toBeCloseTo( 0.6, precision )
	} )
	
	it( 'food is depleted', () => {
		const startingFoodEnergy = 0.0
		const startingPreyEnergy = 0.5
		
		const food = { type: 'food', energy: startingFoodEnergy, preyValue: -0.1, emit }
		const prey = { type: 'prey', energy: startingPreyEnergy, foodValue:  0.1, emit }
		
		transferEnergyBetween( prey, food )
		
		expect( food.energy ).toBeCloseTo( startingFoodEnergy, precision )
		expect( prey.energy ).toBeCloseTo( startingPreyEnergy, precision )
	} )
	
	it( 'prey is depleted', () => {
		const startingFoodEnergy = 0.5
		const startingPreyEnergy = 0.0
		
		const food = { type: 'food', energy: startingFoodEnergy, preyValue: -0.1, emit }
		const prey = { type: 'prey', energy: startingPreyEnergy, foodValue:  0.1, emit }
		
		transferEnergyBetween( prey, food )
		
		expect( food.energy ).toBeCloseTo( startingFoodEnergy, precision )
		expect( prey.energy ).toBeCloseTo( startingPreyEnergy, precision )
	} )
} )
