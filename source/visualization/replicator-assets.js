// const fs = require( 'fs' )
const fs = { readFileSync: () => {} }

const ctx = document.createElement( 'canvas' ).getContext( '2d' )

export const skinColor = 'rgba( 230, 240, 250, 1.0 )'
	
export const backsideGradient = ( () => {
	const angle = -Math.PI / 4 // -45 degrees
	const offset = -1/3
	const x = Math.cos( angle ) * offset
	const y = Math.sin( angle ) * offset
	
	const gradient = ctx.createRadialGradient( x, y, 0, 0, 0, 1 )
	gradient.addColorStop( 0.2, 'rgba(  10,  10,  30, 0.25 )' )
	gradient.addColorStop( 1.0, 'rgba(  10,  10,  30, 0.80 )' )
	
	return gradient
} )()

export const energyGradient = ( () => {
	// we want a crisp edge between the black and transparent color stops
	// we can achieve this by positioning the stops on top of each other
	// but the effect doesn't work at 0.0 or 1.0
	// we get around this by defining the gradient from y = -1 to 1, and putting the overlapping stops in the middle
	
	const gradient = ctx.createLinearGradient( 0, -1, 0, 1 )
	
	gradient.addColorStop( 0.50, 'rgba(  13, 255, 112, 0.00 )' ) // transparent green
	gradient.addColorStop( 0.50, 'rgba(  13, 255, 112, 0.50 )' ) // green
	gradient.addColorStop( 0.51, 'rgba(   1,  26,  11, 0.85 )' ) // dark green
	gradient.addColorStop( 1.00, 'rgba(   7, 141,  62, 0.88 )' ) // green
	
	return gradient
} )()

export const face = ( () => {
	// be careful changing this line
	// brfs is delicate
	const imageData = fs.readFileSync( __dirname + '/replicator-face.png', 'base64' )
	const image = document.createElement( 'img' )
	image.src = 'data:image/png;base64,' + imageData
	
	return image
} )()

const energyUpGradient = ( () => {
	const gradient = ctx.createLinearGradient( 0, -1, 0, 1 )
	
	gradient.addColorStop( 0.0, 'rgba(   0, 255,   0, 0.0 )' )
	gradient.addColorStop( 0.5, 'rgba(   0, 255,   0, 0.3 )' )
	gradient.addColorStop( 0.5, 'rgba(   0, 255,   0, 0.8 )' )
	gradient.addColorStop( 1.0, 'rgba(   0, 255,   0, 0.2 )' )
	
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
		const gradientOffset = energy - energy * Math.pow( this.progress, 3 )
		ctx.translate( 0, gradientOffset )
		
		ctx.globalCompositeOperation = 'screen'
		ctx.globalAlpha = 1 - this.progress
		ctx.fillStyle = energyUpGradient
		ctx.fill()
		
		ctx.translate( 0, -gradientOffset )
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
			ctx.globalAlpha = 0.0 + ( 0.5 - 0.0 ) * ( 1 + Math.cos( this.progress * Math.PI ) ) / 2
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
