import Vector2 from './engine/vector-2'

function leftPadInt( integer: number, maxLength: number = 2, fillString: string = '0' ): string {
	return integer.toString().padStart( maxLength, fillString )
}

// format weight for display
export function formatWeight( w: number ): string {
	const digits = 4
	const separator = '.'
	
	const sign = ( w >= 0 ? ' ' : '-' )
	w = Math.abs( w )
	
	// 0.6666 => 666.6
	w *= Math.pow( 10, digits - 1 )
	// 666.6 => 667
	w = Math.round( w )
	
	const str = leftPadInt( w, digits )
	
	// prepend sign; insert separator after leftmost digit
	return sign + str.slice( 0, 1 ) + separator + str.slice( 1 )
}

export function formatElapsedTime( elapsedSecs: number ): string {
	const secsPerMin = 60
	const secsPerHour = 60 * secsPerMin
	const secsPerDay = 24 * secsPerHour
	
	// round to nearest millisecond
	elapsedSecs = Math.round( elapsedSecs * 1000 ) / 1000
	
	const days = Math.floor( elapsedSecs / secsPerDay )
	elapsedSecs -= days * secsPerDay
	const hours = Math.floor( elapsedSecs / secsPerHour )
	elapsedSecs -= hours * secsPerHour
	const mins = Math.floor( elapsedSecs / secsPerMin )
	elapsedSecs -= mins * secsPerMin
	const secs = Math.floor( elapsedSecs )
	elapsedSecs -= secs
	const ms = Math.floor( elapsedSecs * 1000 )
	
	return (
		days + ':' +
		leftPadInt( hours ) + ':' +
		leftPadInt( mins ) + ':' +
		leftPadInt( secs) + '.' +
		leftPadInt( ms, 3 )
	)
}

export function pick( source: object, keys: string[] ): object {
	const subset = {}
	
	for ( const key of keys ) {
		subset[ key ] = source[ key ]
	}
	
	return subset
}

// mixin for canvas context that adds partial state save/restore
export function CtxPartialStateStack( ctx ) {
	const states = []
	
	ctx.savePartial = function ( ...properties ) {
		states.push( pick( ctx, properties ) )
	}
	
	ctx.restorePartial = function () {
		Object.assign( ctx, states.pop() )
	}
	
	return ctx
}

export function pointIsInCircle( point, circle ) {
	const distance = Vector2.getLength( Vector2.subtract( circle.position, point, {} ) ) - circle.radius
	return distance <= 0
}

export function debounce( fn, delay = 250 ) {
	let timeoutId = null
	
	return () => {
		if ( timeoutId !== null ) {
			clearTimeout( timeoutId )
		}
		
		timeoutId = setTimeout( () => {
			timeoutId = null
			fn()
		}, delay )
	}
}
