import Events from '../engine/events'

const defaultOpts = {
	strength: 4500,
	flipTime: 1.25,
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
			
			this.emit( 'flipping', force, dt )
			
			this.flipProgress += dt / this.flipTime
		}
	},
}
