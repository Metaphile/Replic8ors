import Physics from '../engine/physics'

const defaultOpts = {
	radius:  128,
	mass:    100,
	drag:    10,
	elasticity: 7,
	speed:  170,
}

export default function Predator( opts = {} ) {
	const self = Object.create( Predator.prototype )
	Physics( self )
	Object.assign( self, defaultOpts, opts )
	
	return self
}

Predator.prototype = {
	update( dt ) {
		this.updatePhysics( dt )
	},
}
