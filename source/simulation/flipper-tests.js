import Flipper from './flipper'
import Vector2 from '../engine/vector-2'

const precision = 9
const error = Math.pow( 10, -precision )

describe( 'flipper', () => {
	const TestFlipper = () => {
		const angle = 0
		const opts = { strength: 1, flipTime: 1 }
		const flipper = Flipper( angle, opts )
		
		return flipper
	}
	
	it( 'emits a flipping event', () => {
		const flipper = TestFlipper()
		
		const spy = jasmine.createSpy()
		flipper.on( 'flipping', spy )
		
		flipper.flip()
		flipper.update( 1/60 )
		
		expect( spy ).toHaveBeenCalled()
	} )
	
	it( 'flips for a little bit', () => {
		const flipper = TestFlipper()
		
		const spy = jasmine.createSpy()
		flipper.on( 'flipping', spy )
		
		flipper.flip()
		flipper.update( 1 + error ) // one flip's worth
		flipper.update( 1/60 ) // no more flip
		
		expect( spy ).toHaveBeenCalledTimes( 1 )
	} )
	
	it( 'flips quickly then slowly', () => {
		const flipper = TestFlipper()
		
		const spy = jasmine.createSpy()
		flipper.on( 'flipping', spy )
		
		const forceStrength = () => {
			const force = spy.calls.mostRecent().args[ 0 ]
			return Vector2.getLength( force )
		}
		
		flipper.flip()
		
		flipper.update( 1/60 )
		const initialStrength = forceStrength()
		
		flipper.update( 1/60 )
		const currentStength = forceStrength()
		
		expect( currentStength < initialStrength - error ).toBe( true )
	} )
} )
