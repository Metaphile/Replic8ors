import config from '../config'
import * as assets from './neuron-assets'
import Math2 from '../engine/math-2'
import { potentialDecayFn } from '../simulation/neuron-helpers'

const defaultOpts = {
	radius: 2.7,
	clinginess: 8,
}

function jiggle( x ) {
	return Math.sin( 5 * x * Math.PI ) / ( 0.7 * x ) * 0.06
}

function drawGauge( ctx, neuron ) {
	const tau = Math.PI * 2
	const gaugeStart = tau / 4 // down
	const innerRadius = 0.59
	const outerRadius = 0.93
	
	// while firing, do Pacman death animation
	// rotate potential bar counter-clockwise so gap is top center
	const firingOffset = neuron.firing ? neuron.potential * -Math.PI : 0
	
	ctx.savePartial( 'fillStyle', 'globalCompositeOperation' )
	
	// indicate potential
	ctx.beginPath()
		const potentialStart = gaugeStart + firingOffset
		const potentialStop = potentialStart + neuron.potential * tau
		
		ctx.arc( 0, 0, innerRadius, potentialStart, potentialStop ) // cw
		ctx.arc( 0, 0, outerRadius, potentialStop, potentialStart, true ) // ccw
		
		ctx.fillStyle = config.excitatoryColor
		ctx.globalCompositeOperation = config.excitatoryCompositeOperation
		ctx.fill()
	
	if ( !neuron.firing ) {
		// indicate inhibitory input
		
		const inhibitoryStop = Math.max( gaugeStart - ( neuron.inhibitoryInput * tau ), -( tau - potentialStop ) )
		
		ctx.beginPath()
			ctx.arc( 0, 0, innerRadius, gaugeStart, inhibitoryStop, true ) // ccw
			ctx.arc( 0, 0, outerRadius, inhibitoryStop, gaugeStart ) // cw
			
			ctx.fillStyle = config.inhibitoryColor
			ctx.globalCompositeOperation = config.inhibitoryCompositeOperation
			ctx.fill()
	}
	
	ctx.restorePartial()
}

export default function NeuronView( neuron, role = 'think', opts = {} ) {
	const self = Object.create( NeuronView.prototype )
	Object.assign( self, defaultOpts, opts )
	self.neuron = neuron
	self.icon = assets.icons[ role ]
	self.position = { x: 0, y: 0 }
	// TODO relative
	self.anchor   = { x: 0, y: 0 }
	
	self.originalPosition = { x: 0, y: 0 }
	self.originalRadius = self.radius
	self.connectionOpacity = 1
	
	self.potentialDecayRotation = 0
	
	return self
}

NeuronView.prototype = {
	update( dt_real, dt_sim ) {
		const dx = this.anchor.x - this.position.x
		const dy = this.anchor.y - this.position.y
		
		this.position.x += dx * this.clinginess * dt_real
		this.position.y += dy * this.clinginess * dt_real
		
		// TEMP
		this.radius = defaultOpts.radius
		if ( this.neuron.firing ) this.radius += jiggle( Math.max( 1 - this.neuron.potential, Number.MIN_VALUE ) )
		
		if ( !this.neuron.firing ) {
			this.potentialDecayRotation -= potentialDecayFn( this.neuron.potentialDecayRate ) * Math.PI * 2 * dt_sim
			this.potentialDecayRotation %= Math.PI * 2
		} else {
			this.potentialDecayRotation = 0
		}
	},
	
	draw( ctx, detail ) {
		ctx.savePartial( 'fillStyle', 'globalAlpha', 'globalCompositeOperation' )
		
		ctx.globalCompositeOperation = 'screen'
		
		ctx.beginPath()
			ctx.arc( this.position.x, this.position.y, this.radius, 0, Math.PI * 2 )
			
			if ( this.selected && this.active ) {
				ctx.fillStyle = 'rgba( 255, 70, 0, 0.45 )'
			} else if ( this.selected ) {
				ctx.fillStyle = 'rgba( 255, 70, 0, 0.45 )'
			} else if ( this.active ) {
				ctx.fillStyle = 'rgba( 90, 195, 255, 0.9 )'
			} else {
				ctx.fillStyle = 'rgba( 90, 195, 255, 0.09 )'
			}
			
			ctx.fill()
		
		const beginIconLod = 2.1
		const endIconLod   = 5.4
		
		// icon
		if ( detail >= beginIconLod ) {
			ctx.translate( this.position.x, this.position.y )
			
			if ( !this.neuron.firing ) {
				ctx.rotate( this.potentialDecayRotation )
			}
			
			const r = this.radius * 0.36
			ctx.savePartial( 'globalAlpha' )
			ctx.globalAlpha *= Math.min( ( detail - beginIconLod ) / ( endIconLod - beginIconLod ), 1 )
			
			// shift icons by half a pixel right and down to properly center them
			const halfAPixel = r / this.icon.width
			ctx.drawImage( this.icon, -r + halfAPixel, -r + halfAPixel, r * 2, r * 2 )
			
			ctx.restorePartial()
			
			if ( !this.neuron.firing ) {
				ctx.rotate( -this.potentialDecayRotation )
			}
			
			ctx.translate( -this.position.x, -this.position.y )
		}
		
		ctx.translate( this.position.x, this.position.y )
		ctx.scale( this.radius, this.radius )
		drawGauge( ctx, this.neuron, this.position.x, this.position.y, this.radius )
		ctx.scale( 1 / this.radius, 1 / this.radius )
		ctx.translate( -this.position.x, -this.position.y )
		
		ctx.restorePartial()
	},
}
