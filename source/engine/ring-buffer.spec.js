import RingBuffer from './ring-buffer'

describe( 'ring buffer', () => {
	it( 'has a push method, like Array', () => {
		const buffer = RingBuffer( 1 )
		
		buffer.push( 'A' )
		
		expect( buffer[ 0 ] ).toBe( 'A' )
	} )
	
	it( 'has a configurable capacity', () => {
		const buffer = RingBuffer( 2 )
		
		buffer.push( 1 )
		buffer.push( 2 )
		buffer.push( 3 )
		
		expect( buffer.length ).toBe( 2 )
	} )
	
	it( 'overwrites oldest members when capacity is exceeded', () => {
		const buffer = RingBuffer( 2 )
		
		buffer.push( 'A' )
		buffer.push( 'B' )
		buffer.push( 'C' ) // replaces 'A'
		
		expect( buffer[ 0 ] ).toBe( 'C' )
	} )
} )
