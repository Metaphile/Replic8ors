import Physics from '../engine/physics'

const defaultOpts = {
	radius:  106,
	mass:    90,
	drag:    10,
	elasticity: 7,
	speed:  260,
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
