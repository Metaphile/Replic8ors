import Physics from '../engine/physics'

export default function Predator( opts = {} ) {
	const self = Object.create( Predator.prototype )
	
	Physics( self )
	Object.assign( self, opts )
	
	return self
}

Predator.prototype = {
	drag:        10,
	elasticity:   7,
	mass:       100,
	radius:     128,
	speed:      120,
	
	update( dt ) {
		this.updatePhysics( dt )
	},
}
