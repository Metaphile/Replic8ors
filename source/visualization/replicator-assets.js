// assets common to predators/preys

import faceImageSrc from './replicator-face.png'

const ctx = document.createElement( 'canvas' ).getContext( '2d' )

const DamageEffect = ( onDone ) => {
	const self = Object.create( DamageEffect.prototype )
	self.onDone = onDone
	return self
}

DamageEffect.prototype = {
	duration: 1/3,
	progress: 0,
	
	update( dt_real, dt_sim ) {
		if ( this.progress < 1 ) {
			this.progress += 1 / this.duration * dt_sim
		}
		
		if ( this.progress >= 1 && this.onDone ) {
			this.onDone( this )
			this.onDone = null
		}
	},
	
	draw( ctx, position, radius ) {
		ctx.savePartial( 'fillStyle', 'globalAlpha', 'globalCompositeOperation' )
		
		ctx.beginPath()
			ctx.translate( position.x, position.y )
			ctx.scale( radius, radius )
			
			ctx.arc( 0, 0, 1, 0, Math.PI * 2 )
			
			ctx.globalCompositeOperation = 'overlay'
			ctx.globalAlpha *= 0.0 + ( 0.5 - 0.0 ) * ( 1 + Math.cos( this.progress * Math.PI ) ) / 2
			ctx.fillStyle = 'rgba( 159, 0, 0, 1.0 )'
			ctx.fill()
			
			ctx.scale( 1 / radius, 1 / radius )
			ctx.translate( -position.x, -position.y )
		
		ctx.restorePartial()
	},
}

const DeathEffect = ( onDone ) => {
	const self = Object.create( DeathEffect.prototype )
	self.onDone = onDone
	return self
}

DeathEffect.prototype = {
	duration: 1,
	progress: 0,
	
	update( dt_real, dt_sim ) {
		if ( this.progress < 1 ) {
			this.progress += 1 / this.duration * dt_sim
		}
		
		if ( this.progress >= 1 && this.onDone ) {
			this.progress = 1
			this.onDone( this )
			this.onDone = null
		}
	},
}

const EnergyUpEffectFactory = ( energyUpGradient ) => {
	const EnergyUpEffect = ( duration, onDone ) => {
		const self = Object.create( EnergyUpEffect.prototype )
		self.duration = duration
		self.onDone = onDone
		self.progress = 0
		
		return self
	}
	
	EnergyUpEffect.prototype = {
		update( dt, dt2 ) {
			if ( this.progress < 1 ) {
				this.progress += 1 / this.duration * dt2
			}
			
			if ( this.progress >= 1 && this.onDone ) {
				this.onDone( this )
				this.onDone = null
			}
		},
		
		// assumes energy gradient transforms have been applied
		draw( ctx, energy ) {
			ctx.savePartial( 'fillStyle', 'globalAlpha', 'globalCompositeOperation' )
			
			const gradientOffset = 1 - Math.pow( this.progress, 1/2 ) * 2
			// undo energy translation so y=0 is at replicator center, y=1 is at bottom
			ctx.translate( 0, -energy )
			ctx.translate( 0, gradientOffset )
			
			ctx.globalCompositeOperation = 'screen'
			ctx.globalAlpha *= Math.pow( 1 - this.progress, 2 )
			ctx.fillStyle = energyUpGradient
			ctx.fill()
			
			ctx.translate( 0, -gradientOffset )
			ctx.translate( 0, energy )
			
			ctx.restorePartial()
		},
	}
	
	return EnergyUpEffect
}

const backsideGradient = ( () => {
	const angle = -Math.PI / 4 // -45 degrees
	const offset = -1/3
	const x = Math.cos( angle ) * offset
	const y = Math.sin( angle ) * offset
	
	const gradient = ctx.createRadialGradient( x, y, 0, 0, 0, 1 )
	gradient.addColorStop( 0.2, 'rgba(   0,   0,   0, 0.25 )' )
	gradient.addColorStop( 1.0, 'rgba(   0,   0,   0, 0.80 )' )
	
	return gradient
} )()

const face = ( () => {
	const image = document.createElement( 'img' )
	image.src = faceImageSrc
	
	return image
} )()

export {
	DamageEffect,
	DeathEffect,
	EnergyUpEffectFactory,
	backsideGradient,
	ctx,
	face,
}
