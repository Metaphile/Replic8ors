import Food from '../../source/simulation/food'

const precision = 9
const error = Math.pow( 10, -precision )

describe( 'food', () => {
	it( 'has position and radius', () => {
		const food = Food()
		
		expect( 'position' in food ).toBe( true )
		expect( 'radius' in food ).toBe( true )
	} )
	
	describe( 'consumption', () => {
		it( 'has calories', () => {
			const food = Food()
			
			expect( 'calories' in food ).toBe( true )
		} )
		
		it( 'can be eaten', () => {
			const food = Food()
			expect( food.eaten ).toBe( false )
			
			food.chomp()
			expect( food.eaten ).toBe( true )
		} )
		
		it( 'emits eaten event', () => {
			const food = Food()
			const spy = jasmine.createSpy()
			
			food.on( 'eaten', spy )
			food.chomp()
			
			expect( spy ).toHaveBeenCalled()
		} )
		
		it( 'releases event handlers when it gets eaten', () => {
			const food = Food()
			const spy = jasmine.createSpy()
			
			food.on( 'eaten', spy )
			food.chomp() // notify then release event handlers
			food.emit( 'eaten' ) // should be a no-op
			
			expect( spy ).toHaveBeenCalledTimes( 1 )
		} )
	} )
	
	describe( 'spoilage', () => {
		it( 'ages', () => {
			const food = Food( { shelfLife: 60 } )
			
			food.update( 42 )
			
			expect( food.age ).toBeCloseTo( 42, precision )
		} )
		
		it( 'spoils eventually', () => {
			const food = Food( { shelfLife: 60 } )
			expect( food.spoiled ).toBe( false )
			
			food.update( 60 + error )
			expect( food.spoiled ).toBe( true )
		} )
		
		it( 'emits spoiled event', () => {
			const food = Food( { shelfLife: 60 } )
			const spy = jasmine.createSpy()
			
			food.on( 'spoiled', spy )
			food.update( 60 + error )
			
			expect( spy ).toHaveBeenCalled()
		} )
		
		it( 'releases event handlers when it spoils', () => {
			const food = Food()
			const spy = jasmine.createSpy()
			
			food.on( 'spoiled', spy )
			food.spoil() // notify then release event handlers
			food.emit( 'spoiled' ) // should be a no-op
			
			expect( spy.calls.count() ).toBe( 1 )
		} )
	} )
} )
