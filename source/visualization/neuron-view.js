import assets from './neuron-assets'
import Math2 from '../engine/math-2'

// gauge.clear()
// gauge.addSection( percent, color )
// gauge.draw( ctx, x, y, outerRadius, innerRadius )
//
// function addGaugeSegment( amount, color ) {
//
// }

const defaultOpts = {
	radius: 3.3,
	clinginess: 8,
}

const GAUGE_START = Math.PI / 2 // down

function jiggle( x ) {
	return Math.sin( 5 * x * Math.PI ) / ( 0.7 * x ) * 0.06
}

// TODO don't draw gauge if potential is very tiny
function drawGauge( ctx, neuron, ppx, ppy, r ) {
	var potential = Math.max(0, neuron.potential);
	var offset = neuron.firing ? Math.PI * potential : 0;
	
	var r1 = r * 0.5, r2 = r * 1.0;
	var a1 = GAUGE_START - offset, a2 = a1 + (potential * Math2.TAU);
	
	var a3 = a2 + (neuron.inhibitedPotential * Math2.TAU);
	// var a0 = a1 - ( neuron.inhibitedPotential * Math.PI * 2 )
	
	// indicate negated potential
	if ( !neuron.firing && neuron.inhibitedPotential > 0.01 ) {
		ctx.beginPath()
			ctx.arc( ppx, ppy, r1, a2, a3 )
			ctx.arc( ppx, ppy, r2, a3, a2, true ) // opposite direction
			
			ctx.fillStyle = 'rgba( 190,   0,   0, 0.7 )'
			const gco = ctx.globalCompositeOperation
			ctx.globalCompositeOperation = 'darken'
			ctx.fill()
			ctx.globalCompositeOperation = gco
	}
	
	ctx.beginPath()
		ctx.arc( ppx, ppy, r1, a1, a2 )
		ctx.arc( ppx, ppy, r2, a2, a1, true )
		
		const gco = ctx.globalCompositeOperation
		ctx.globalCompositeOperation = 'screen'
		ctx.fillStyle = 'rgba(  90, 195, 255, 1.0 )'
		ctx.fill()
		ctx.globalCompositeOperation = gco
}

export default function NeuronView( neuron, opts = {} ) {
	const self = Object.create( NeuronView.prototype )
	Object.assign( self, defaultOpts, opts )
	self.neuron = neuron
	self.position = { x: 0, y: 0 }
	// TODO relative
	self.anchor   = { x: 0, y: 0 }
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
		// ctx.drawImage( assets.body, this.position.x - assets.body.width / 2, this.position.y - assets.body.height / 2 )
		
		const gco = ctx.globalCompositeOperation
		ctx.globalCompositeOperation = 'screen'
		
		ctx.beginPath()
			ctx.arc( this.position.x, this.position.y, this.radius * 0.5, 0, Math.PI * 2 )
			ctx.fillStyle = 'rgba(  90, 195, 255, 0.3 )'
			ctx.fill()
			
		/* ctx.beginPath()
			ctx.arc( this.position.x, this.position.y, this.radius * 0.5, 0, Math.PI * 2 )
			ctx.fillStyle = 'rgba( 255, 255, 255, 1.0 )'
			ctx.fill() */
			
			// ctx.lineWidth = 0.2
			// ctx.strokeStyle = 'rgba( 255, 255, 255, 0.5 )'
			// ctx.stroke()
		
		/* ctx.beginPath()
			const lineWidth = this.radius * ( 1 - 0.666 )
			
			ctx.arc( this.position.x, this.position.y, this.radius - lineWidth / 2 + 0.01, 0, Math.PI * 2 )
			ctx.strokeStyle = 'rgba( 0, 115, 128, 1.0 )'
			ctx.lineWidth = lineWidth
			ctx.stroke() */
		
		ctx.globalCompositeOperation = gco
		
		drawGauge( ctx, this.neuron, this.position.x, this.position.y, this.radius )
		
		// icon
		// if ( detail > 0.999 ) {
		// 	const r = this.radius * 0.3
		// 	ctx.drawImage( assets.icons.think, this.position.x - r, this.position.y - r, r * 2, r * 2 )
		// }
	},
}
