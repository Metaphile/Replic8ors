import Physics from '../engine/physics'
import Events from '../engine/events'

const defaultOpts = {
	type: 'food',
	age: 0,
	calories: 0.7,
	shelfLife: 5 * 60,
	eaten: false,
	spoiled: false,
	radius: 2.7,
	mass: 4,
	drag: 16,
	elasticity: 2,
}

export default function Food( opts = {} ) {
	const self = Object.create( Food.prototype )
	
	Physics( self )
	Events( self )
	
	Object.assign( self, defaultOpts, opts )
	
	return self
}

Food.prototype = {
	update: function ( dt ) {
		this.age += dt
		
		if ( this.age >= this.shelfLife ) this.spoil()
		
		this.updatePhysics( dt )
	},
	
	chomp: function () {
		this.eaten = true
		this.emit( 'eaten', this )
		this.off()
	},
	
	spoil: function () {
		this.spoiled = true
		this.emit( 'spoiled', this )
		this.off()
	},
}
