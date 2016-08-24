import Vector2 from '../engine/vector-2'

export default function Spring( position, opts = {} ) {
	const self = {}
	
	self.position = position
	self.flow = 24
	self.radius = 192
	Object.assign( self, opts )
	
	self.applyForce = ( physics, dt ) => {
		const offset = Vector2.subtract( physics.position, self.position, {} )
		const distance = Vector2.getLength( offset )
		
		if ( distance < self.radius ) {
			Vector2.scale( offset, Math.pow( 1 - distance / self.radius, 2 ) * self.flow )
			physics.applyForce( offset, dt )
		}
	}
	
	return self
}
