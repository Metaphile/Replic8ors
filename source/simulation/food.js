import Physics from '../engine/physics'
import Events from '../engine/events'
import settings from '../settings/settings'

export default function Food( opts = {} ) {
	const self = Object.create( Food.prototype )
	
	self.previousColliders = []
	self.currentColliders = []
	
	Physics( self )
	Events( self )
	
	Object.assign( self, settings.food, opts )
	
	return self
}

Food.prototype = {
	type: 'food',
	age: 0,
	eaten: false,
	spoiled: false,
	energy: 1,
	
	update: function ( dt ) {
		this.energy = Math.min( this.energy, 1 )
		
		this.age += dt
		
		if ( this.energy <= 0 ) {
			this.chomp()
		} else if ( this.age >= this.shelfLife ) {
			this.spoil()
		}
		
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
