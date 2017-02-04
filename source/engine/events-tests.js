import Events from './events'

describe( 'events mixin', () => {
	it( 'adds event logic to objects', () => {
		const myObject = {}
		
		Events( myObject )
		
		expect( 'emit' in myObject ).toBe( true )
	} )
	
	it( 'notifies subscribers', () => {
		const events = Events()
		
		const spy = jasmine.createSpy()
		events.on( 'event', spy )
		
		events.emit( 'event' )
		
		expect( spy ).toHaveBeenCalled()
	} )
	
	it( 'notifies subscribers with arguments', () => {
		const events = Events()
		
		const spy = jasmine.createSpy()
		events.on( 'event', spy )
		
		const arg1 = {}
		const arg2 = {}
		events.emit( 'event', arg1, arg2 )
		
		expect( spy ).toHaveBeenCalledWith( arg1, arg2 )
	} )
} )
