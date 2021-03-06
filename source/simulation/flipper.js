import Events from '../engine/events'

const defaultOpts = {
	// overridden in scenario
	strength: 4500,
	flipTime: 0.8,
}

export default function Flipper( angle, opts = {} ) {
	const self = Object.create( Flipper.prototype )
	Events( self )
	Object.assign( self, defaultOpts, opts )
	
	self.angle = angle
	
	return self
}

Flipper.prototype = {
	angle: 0,
	flipProgress: 1,
	
	flip() {
		this.flipProgress = 0
	},
	
	update( dt ) {
		if ( this.flipProgress < 1 ) {
			const force = {}
			
			// effort trails off
			const effort = this.strength * Math.pow( 1 - this.flipProgress, 2 )
			const direction = this.angle + Math.PI
			
			force.x = Math.cos( direction ) * effort
			force.y = Math.sin( direction ) * effort
			
			// TODO config param
			this.emit( 'flipping', force, dt, 0.024 * effort )
			
			this.flipProgress += dt / this.flipTime
		}
	},
}
