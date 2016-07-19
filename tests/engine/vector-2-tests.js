import Vector2 from '../../source/engine/vector-2'

const precision = 9

describe( 'vector 2', () => {
	it( 'makes 2-vectors', () => {
		const v = Vector2()
		
		expect( 'x' in v ).toBe( true )
		expect( 'y' in v ).toBe( true )
	} )
	
	it( 'gets the angle of a vector', () => {
		const angle = Math.PI / 4 // 45 degrees
		
		const v = Vector2()
		v.x = Math.cos( angle )
		v.y = Math.sin( angle )
		
		expect( Vector2.angle( v ) ).toBeCloseTo( angle, precision )
	} )
	
	it( 'checks vectors for zeroness', () => {
		expect( Vector2.isNonZero( { x: 1, y: 2   } ) ).toBe( true )
		expect( Vector2.isNonZero( { x: 0, y: 0.1 } ) ).toBe( true )
		
		expect( Vector2.isNonZero( { x: 0, y: 0   } ) ).toBe( false )
	} )
} )
