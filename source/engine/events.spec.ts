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
	
	it( 'on() returns subscription object', () => {
		const events = Events()
		
		const subscription = events.on( 'event', () => {} )
		
		expect( subscription ).toBeTruthy()
	} )
	
	it( 'subscription.unsubscribe() stops event notifications', () => {
		const events = Events()
		
		const spy = jasmine.createSpy()
		const subscription = events.on( 'event', spy )
		
		subscription.unsubscribe()
		events.emit( 'event' )
		
		expect( spy ).not.toHaveBeenCalled()
	} )
} )
