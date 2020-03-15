import faceImageSrc from './replicator-face.png'

const ctx = document.createElement( 'canvas' ).getContext( '2d' )

export const skinColor = 'black'

export const backsideGradient = ( () => {
	const angle = -Math.PI / 4 // -45 degrees
	const offset = -1/3
	const x = Math.cos( angle ) * offset
	const y = Math.sin( angle ) * offset
	
	const gradient = ctx.createRadialGradient( x, y, 0, 0, 0, 1 )
	gradient.addColorStop( 0.2, 'rgba(   0,   0,   0, 0.3 )' )
	gradient.addColorStop( 1.0, 'rgba(   0,   0,   0, 0.9 )' )
	
	return gradient
} )()

export const energyGradient = ( () => {
	// we want a crisp edge between the black and transparent color stops
	// we can achieve this by positioning the stops on top of each other
	// but the effect doesn't work at 0.0 or 1.0
	// we get around this by defining the gradient from y = -1 to 1, and putting the overlapping stops in the middle
	
	const gradient = ctx.createLinearGradient( 0, -1, 0, 1 )
	
	gradient.addColorStop( 0.500, 'rgba( 160,   0,  20, 0.00 )' ) // transparent red
	gradient.addColorStop( 0.500, 'rgba( 160,   0,  20, 0.60 )' ) // red
	gradient.addColorStop( 0.504, 'rgba(   0,   0,   0, 1.00 )' ) // black
	gradient.addColorStop( 1.000, 'rgba( 160,   0,  20, 1.00 )' ) // red
	
	return gradient
} )()

export const face = ( () => {
	const image = document.createElement( 'img' )
	image.src = faceImageSrc
	
	return image
} )()

const energyUpGradient = ( () => {
	const gradient = ctx.createLinearGradient( 0, -1, 0, 1 )
	
	gradient.addColorStop( 0.0, 'rgba( 255,   0,   0, 0.0 )' )
	gradient.addColorStop( 0.5, 'rgba( 255,   0,   0, 0.3 )' )
	gradient.addColorStop( 0.5, 'rgba( 255,   0,   0, 0.8 )' )
	gradient.addColorStop( 1.0, 'rgba( 255,   0,   0, 0.2 )' )
	
	return gradient
} )()

export const EnergyUpEffect = ( duration, onDone ) => {
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
		const globalCompositeOperation = ctx.globalCompositeOperation
		const globalAlpha = ctx.globalAlpha
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
		ctx.globalAlpha = globalAlpha
		ctx.globalCompositeOperation = globalCompositeOperation
	},
}

export function DamageEffect( onDone ) {
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
		const ctx_globalCompositeOperation = ctx.globalCompositeOperation
		const ctx_globalAlpha = ctx.globalAlpha
		
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
		
		ctx.globalAlpha = ctx_globalAlpha
		ctx.globalCompositeOperation = ctx_globalCompositeOperation
	},
}

export function DeathEffect( onDone ) {
	const self = Object.create( DeathEffect.prototype )
	self.onDone = onDone
	return self
}

DeathEffect.prototype = {
	duration: 2,
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
