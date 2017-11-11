import Vector2 from './vector-2'

const defaultOpts = {
	mass: 1,
	drag: 1,
	radius: 1,
	elasticity: 1,
}

export default function Physics( self = {}, opts = {} ) {
	Object.assign( self, Physics.prototype ) // is this OK?
	Object.assign( self, defaultOpts, opts )
	
	self.position = Vector2()
	self.velocity = Vector2()
	
	return self
}

Physics.prototype = {
	updatePhysics: function ( dt ) {
		// high mass bodies are less affected by drag and vice versa
		let scale = this.drag / this.mass
		// effect scales with time
		scale *= dt
		// -> 0..1
		scale = 1 / ( scale + 1 )
		
		// apply drag force directly
		Vector2.scale( this.velocity, scale )
		
		this.position.x += this.velocity.x * dt
		this.position.y += this.velocity.y * dt
	},
	
	// MAYBE optional offset param
	// offset forces change angular velocity as well
	applyForce: function ( force, dt ) {
		this.velocity.x += force.x / this.mass * dt
		this.velocity.y += force.y / this.mass * dt
	},
	
	collideWith: function ( that, dt ) {
		const offset = Vector2.subtract( that.position, this.position, {} )
		
		// if bodies are exactly on top of each other,
		// pick a random direction to repel in
		if ( offset.x === 0 && offset.y === 0 ) {
			const angle = Math.random() * Math.PI * 2
			offset.x = Math.cos( angle ) * 0.001
			offset.y = Math.sin( angle ) * 0.001
		}
		
		const overlap = Math.pow( this.radius + that.radius, 2 ) - Vector2.lengthSquared( offset )
		
		if ( overlap > 0 ) {
			// repurpose offset as repulsive force vector
			const force = Vector2.normalize( offset )
			
			this.applyForce( Vector2.scale( force, -overlap / this.elasticity, {} ), dt )
			that.applyForce( Vector2.scale( force,  overlap / that.elasticity, {} ), dt )
		}
	},
	
	// too useful for testing
	speed: function () {
		return Vector2.getLength( this.velocity )
	},
}
