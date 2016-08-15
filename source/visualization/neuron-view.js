import * as assets from './neuron-assets'
import Math2 from '../engine/math-2'

// gauge.clear()
// gauge.addSection( percent, color )
// gauge.draw( ctx, x, y, outerRadius, innerRadius )
//
// function addGaugeSegment( amount, color ) {
//
// }

const defaultOpts = {
	radius: 3.4,
	clinginess: 8,
}

const GAUGE_START = Math.PI / 2 // down

function jiggle( x ) {
	return Math.sin( 5 * x * Math.PI ) / ( 0.7 * x ) * 0.06
}

// TODO don't draw gauge if potential is very tiny
function drawGauge( ctx, neuron, ppx, ppy, r ) {
	const tau = Math.PI * 2
	var potential = neuron.potential;
	var offset = neuron.firing ? Math.PI * potential : 0;
	
	var r1 = r * 0.5, r2 = r * 1.0;
	var a1 = GAUGE_START - offset, a2 = a1 + (potential * Math2.TAU);
	
	// Math.min() because sometimes a3 > GAUGE_END -- not sure why!
	// var a3 = Math.min(a2 + (neuron.inhibitedPotential * Math2.TAU), GAUGE_START + Math2.TAU);
	var a0 = Math.max( a1 - ( neuron.inhibitoryInput * tau ), -( tau - a2 ) )
	
	// indicate negated potential
	if ( !neuron.firing ) {
		ctx.beginPath()
			ctx.arc( ppx, ppy, r1, a0, a1 )
			ctx.arc( ppx, ppy, r2, a1, a0, true ) // opposite direction
			
			ctx.fillStyle = 'rgba( 190,   0,   0, 0.666 )'
			ctx.globalCompositeOperation = 'darken'
			ctx.fill()
	}
	
	ctx.beginPath()
		ctx.arc( ppx, ppy, r1, a1, a2 )
		ctx.arc( ppx, ppy, r2, a2, a1, true )
		
		ctx.fillStyle = 'rgba(  90, 195, 255, 1.0 )'
		ctx.globalCompositeOperation = 'screen'
		ctx.fill()
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
	
	return self
}

NeuronView.prototype = {
	update( dt, dt2 ) {
		const dx = this.anchor.x - this.position.x
		const dy = this.anchor.y - this.position.y
		
		this.position.x += dx * this.clinginess * dt2
		this.position.y += dy * this.clinginess * dt2
		
		// TEMP
		this.radius = defaultOpts.radius
		if ( this.neuron.firing ) this.radius += jiggle( Math.max( 1 - this.neuron.potential, Number.MIN_VALUE ) )
	},
	
	draw( ctx, detail ) {
		const globalCompositeOperation = ctx.globalCompositeOperation
		
		ctx.beginPath()
			ctx.arc( this.position.x, this.position.y, this.radius, 0, Math.PI * 2 )
			ctx.globalCompositeOperation = 'screen'
			ctx.fillStyle = 'rgba(  90, 195, 255, 0.16 )'
			ctx.fill()
		
		// icon
		if ( detail > 0.1 ) {
			ctx.translate( this.position.x, this.position.y )
			
			const rotation = ( -this.neuron.inhibitoryInput * Math.PI * 2 ) % ( Math.PI * 2 )
			if ( !this.neuron.firing ) {
				ctx.rotate( rotation )
			}
			
			const r = this.radius * 0.3
			ctx.globalCompositeOperation = 'screen'
			ctx.globalAlpha = 1 - ( 1 - detail ) / 0.9
			ctx.drawImage( this.icon, -r + r/16, -r + r/16, r * 2, r * 2 )
			ctx.globalAlpha = 1
			
			if ( !this.neuron.firing ) {
				ctx.rotate( -rotation )
			}
			
			ctx.translate( -this.position.x, -this.position.y )
		}
		
		drawGauge( ctx, this.neuron, this.position.x, this.position.y, this.radius )
		
		ctx.globalCompositeOperation = globalCompositeOperation
	},
}
