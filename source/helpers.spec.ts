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

describe( 'formatElapsedTime()', () => {
	const { formatElapsedTime } = helpers
	
	it( '0', () => {
		expect( formatElapsedTime( 0 ) ).toBe( '0:00:00:00.000' )
	} )
	
	it( '1ms', () => {
		expect( formatElapsedTime( 0.001 ) ).toBe( '0:00:00:00.001' )
	} )
	
	it( '100ms', () => {
		expect( formatElapsedTime( 0.100 ) ).toBe( '0:00:00:00.100' )
	} )
	
	it( '999.5ms', () => {
		expect( formatElapsedTime( 0.9995 ) ).toBe( '0:00:00:01.000' )
	} )
	
	it( '1s', () => {
		expect( formatElapsedTime( 1 ) ).toBe( '0:00:00:01.000' )
	} )
	
	it( '1m', () => {
		expect( formatElapsedTime( 60 ) ).toBe( '0:00:01:00.000' )
	} )
	
	it( '1h', () => {
		expect( formatElapsedTime( 60 * 60 ) ).toBe( '0:01:00:00.000' )
	} )
	
	it( '1d', () => {
		expect( formatElapsedTime( 24 * 60 * 60 ) ).toBe( '1:00:00:00.000' )
	} )
	
	it( '99d', () => {
		expect( formatElapsedTime( 99 * 24 * 60 * 60 ) ).toBe( '99:00:00:00.000' )
	} )
} )

describe( 'pick()', () => {
	const { pick } = helpers
	
	it( 'picks zero properties', () => {
		const obj = {
			foo: 'foo',
			bar: 'bar',
		}
		
		expect( pick( obj, [] ) ).toEqual( {} )
	} )
	
	it( 'picks one property', () => {
		const obj = {
			foo: 'foo',
			bar: 'bar',
		}
		
		expect( pick( obj, [ 'foo' ] ) ).toEqual( { foo: 'foo' } )
	} )
	
	it( 'picks multiple properties', () => {
		const obj = {
			foo: 'foo',
			bar: 'bar',
		}
		
		expect( pick( obj, [ 'foo', 'bar' ] ) ).toEqual( { foo: 'foo', bar: 'bar' } )
	} )
	
	it( 'doesn\'t validate source properties ', () => {
		expect( pick( {}, [ 'foo']  ) ).toEqual( { foo: undefined } )
	} )
} )

describe( 'debounce()', () => {
	const { debounce } = helpers
	
	beforeEach( () => {
		jasmine.clock().install()
	} )
	
	afterEach( () => {
		jasmine.clock().uninstall()
	} )
	
	it( 'calls debounced function after delay', () => {
		const spy = jasmine.createSpy()
		const debouncedSpy = debounce( spy, 250 )
		
		debouncedSpy()
		
		expect( spy ).not.toHaveBeenCalled()
		jasmine.clock().tick( 250 )
		expect( spy ).toHaveBeenCalled()
	} )
	
	it( 'consolidates consecutive function calls', () => {
		const spy = jasmine.createSpy()
		const debouncedSpy = debounce( spy, 250 )
		
		debouncedSpy()
		debouncedSpy()
		
		jasmine.clock().tick( 250 )
		
		expect( spy ).toHaveBeenCalledTimes( 1 )
	} )
	
	it( 'resets delay with consecutive function calls', () => {
		const spy = jasmine.createSpy()
		const debouncedSpy = debounce( spy, 250 )
		
		debouncedSpy()
		jasmine.clock().tick( 250 - 1 ) // < 250
		debouncedSpy() // resets delay
		jasmine.clock().tick( 250 - 1 ) // < 250
		
		expect( spy ).not.toHaveBeenCalled()
		jasmine.clock().tick( 1 )
		expect( spy ).toHaveBeenCalledTimes( 1 )
	} )
	
	// TODO handle arguments!
} )
