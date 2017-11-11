import Physics from './physics'

const precision = 9
const error = Math.pow( 10, -precision )
// TODO const dt = 1/60

describe( 'physics', () => {
	// test body with known configuration
	function Body( opts = {} ) {
		const body = {}
		
		const defaultOpts = { mass: 1, drag: 1 }
		opts = Object.assign( {}, defaultOpts, opts )
		
		return Physics( body, opts )
	}
	
	it( 'forces change velocity', () => {
		const body = Body()
		const force = { x: 2, y: -3 } // any non-zero value
		
		body.applyForce( force, 1/60 )
		
		expect( body.velocity.x >  error ).toBe( true )
		expect( body.velocity.y < -error ).toBe( true )
	} )
	
	it( 'forces change velocity proportionate to mass', () => {
		const pebble  = Body( { mass:  0.1 } )
		const boulder = Body( { mass: 10.0 } )
		const force = { x: 3, y: 4 }
		
		pebble.applyForce(  force, 1/60 )
		boulder.applyForce( force, 1/60 )
		
		expect( pebble.speed() > boulder.speed() + error ).toBe( true )
	} )
	
	it( 'angular velocity changes rotation', () => {
		const body = Body()
		body.angularVelocity = 1
		
		body.updatePhysics( 1/60 )
		
		expect( body.rotation > 0 ).toBe( true )
	} )
	
	it( 'torque changes angular velocity', () => {
		const body = Body()
		
		expect( body.angularVelocity ).toBe( 0 )
		body.applyTorque( 1, 1/60 )
		expect( body.angularVelocity > 0 ).toBe( true )
	} )
	
	// TODO
	xit( 'torque changes angular velocity proportionate to mass', () => {
		
	} )
	
	it( 'drag reduces angular velocity', () => {
		const body = Body()
		body.angularVelocity = 1
		
		body.updatePhysics( 1/60 )
		
		expect( body.angularVelocity < 1 )
	} )
	
	it( 'drag reduces negative angular velocity', () => {
		const body = Body()
		body.angularVelocity = -1
		
		body.updatePhysics( 1/60 )
		
		expect( body.angularVelocity > -1 )
	} )
	
	it( 'drag reduces velocity', () => {
		const body = Body()
		
		body.velocity = { x: 4, y: 3 }
		const initialSpeed = body.speed()
		
		body.updatePhysics( 1/60 )
		
		expect( body.speed() < initialSpeed - error ).toBe( true )
	} )
	
	it( 'less drag < more drag', () => {
		const racecar   = Body( { drag:  0.1 } )
		const parachute = Body( { drag: 10.0 } )
		
		// same initial velocity
		for ( const body of [ racecar, parachute ] ) {
			body.velocity = { x: 3, y: -4 }
			body.updatePhysics( 1/60 )
		}
		
		expect( parachute.speed() < racecar.speed() - error ).toBe( true )
	} )
	
	it( 'drag affects smaller masses more than larger masses', () => {
		const feather = Body( { mass:  0.1 } )
		const hammer  = Body( { mass: 10.0 } )
		 
		for ( const body of [ feather, hammer ] ) {
			body.velocity = { x: -5, y: 3 }
			body.updatePhysics( 1/60 )
		}
		
		expect( feather.speed() < hammer.speed() - error ).toBe( true )
	} )
} )
