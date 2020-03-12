import * as helpers from './helpers'

describe( 'formatWeight()', () => {
	const { formatWeight } = helpers
	
	it( '1', () => {
		expect( formatWeight( 1 ) ).toBe( ' 1.000' )
	} )
	
	it( '0', () => {
		expect( formatWeight( 0 ) ).toBe( ' 0.000' )
	} )
	
	it( '-1', () => {
		expect( formatWeight( -1 ) ).toBe( '-1.000' )
	} )
	
	it( '1/3', () => {
		expect( formatWeight( 1/3 ) ).toBe( ' 0.333' )
	} )
	
	it( '2/3', () => {
		expect( formatWeight( 2/3 ) ).toBe( ' 0.667' )
	} )
	
	it( '-2/3', () => {
		expect( formatWeight( -2/3 ) ).toBe( '-0.667' )
	} )
	
	it( '0.1', () => {
		expect( formatWeight( 0.1 ) ).toBe( ' 0.100' )
	} )
	
	it( '-0.01', () => {
		expect( formatWeight( -0.01 ) ).toBe( '-0.010' )
	} )
} )
