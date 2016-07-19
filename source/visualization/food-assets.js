import Physics from '../engine/physics'
import Vector2 from '../engine/vector-2'
import Math2 from '../engine/math-2'

export const CrumbsEffect = ( origin, direction, onDone, opts = {} ) => {
	const self = Object.create( CrumbsEffect.prototype )
	self.onDone = onDone
	Object.assign( self, opts )
	
	self.progress = 0
	self.crumbs = []
	
	for ( let n = self.count; n > 0; n-- ) {
		const crumb = Physics()
		crumb.drag = 1.5
		
		crumb.position = Vector2.clone( origin )
		
		const crumbDirection = direction ?
			Math2.randRange( direction - 0.4, direction + 0.1 ) :
			Math.random() * Math.PI * 2
		
		const speed = Math.random() * self.maxSpeed
		
		crumb.velocity = {
			x: Math.cos( crumbDirection ) * speed,
			y: Math.sin( crumbDirection ) * speed,
		}
		
		const offset = Vector2.scale( crumb.velocity, 1/self.maxSpeed * 3, {} )
		Vector2.add( crumb.position, offset )
		
		crumb.radius = Math.random() * self.maxRadius
		
		self.crumbs.push( crumb )
	}
	
	return self
}

CrumbsEffect.prototype = {
	// default opts
	duration: 1.8,
	count: 3,
	maxRadius: 1.6,
	maxSpeed: 80,
	
	update( dt, dt2 ) {
		if ( this.progress < 1 ) {
			for ( let crumb of this.crumbs ) {
				crumb.updatePhysics( dt2 )
			}
			
			this.progress += 1 / this.duration * dt2
		}
		
		if ( this.progress >= 1 && this.onDone ) {
			this.onDone()
			this.onDone = null
		}
	},
	
	draw( ctx ) {
		const globalAlpha = ctx.globalAlpha
		ctx.globalAlpha = 1 - this.progress
		ctx.fillStyle = 'white'
		
		for ( let crumb of this.crumbs ) {
			ctx.beginPath()
				ctx.arc( crumb.position.x, crumb.position.y, crumb.radius, 0, Math.PI * 2 )
				ctx.fill()
		}
		
		ctx.globalAlpha = globalAlpha
	},
}

export const SpoiledEffect = ( position, onDone, opts = {} ) => {
	const self = Object.create( SpoiledEffect.prototype )
	self.position = Vector2.clone( position )
	self.onDone = onDone
	Object.assign( self, opts )
	
	self.progress = 0
	
	return self
}

SpoiledEffect.prototype = {
	duration: 2.5,
	
	update( dt, dt2 ) {
		if ( this.progress < 1 ) {
			this.progress += 1 / this.duration * dt2
		}
		
		if ( this.progress >= 1 && this.onDone ) {
			this.onDone()
			this.onDone = null
		}
	},
	
	draw( ctx ) {
		const globalAlpha = ctx.globalAlpha
		ctx.globalAlpha = ( 1 - this.progress ) * 0.18
		ctx.fillStyle = 'white'
		
		const scaleFactor = 1 + Math.pow( this.progress, 0.5 ) * 3.5
		const r = 1.9 * scaleFactor
		
		ctx.beginPath()
			ctx.arc( this.position.x, this.position.y, r, 0, Math.PI * 2 )
			ctx.fillStyle = 'white'
			ctx.fill()
		
		ctx.globalAlpha = globalAlpha
	},
}
