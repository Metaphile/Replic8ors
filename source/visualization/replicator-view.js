// TODO initial position for neuron views
// TODO fisheye lense effect for neurons
// apply constant repulsive force; let springiness and collisions do their thing

import * as assets from './replicator-assets'
import { drawConnections, drawConnection } from './replicator-view-internals'
import NeuronView from './neuron-view'
import Math2 from '../engine/math-2'
import Vector2 from '../engine/vector-2'

const drawEnergyLevel = ( ctx, ppx, ppy, r, energy, slosh, effects ) => {
	// skin
	// r -= 3.4 / 2
	
	const globalCompositeOperation = ctx.globalCompositeOperation
	
	ctx.beginPath()
		ctx.arc( ppx, ppy, r, 0, Math2.TAU )
		
		const dx = ppx
		const dy = ppy + r - ( energy * r * 2 ) + Math.cos( slosh * 26 ) * 0.1
		const ds = r * 2
		
		slosh = ( Math.cos( slosh * 7 ) * Math.sin( slosh * 13 ) ) * 0.006
		
		ctx.translate( dx, dy )
		// TODO separate rotation parameter
		ctx.rotate( slosh )
		ctx.scale( 1, ds )
		
		ctx.globalCompositeOperation = 'darken'
		ctx.fillStyle = assets.energyGradient
		ctx.fill()
		
		for ( let effect of effects.energyUps ) effect.draw( ctx, energy )
		
		ctx.scale( 1, 1 / ds )
		ctx.rotate( -slosh )
		ctx.translate( -dx, -dy )
	
	ctx.globalCompositeOperation = globalCompositeOperation
}

function drawFlippers( ctx, replicator ) {
	var p0 = replicator.position
	var r0 = replicator.radius + 0.7
	var flippers = replicator.flippers
	
	var LENGTH    = 0.4
	var WIDTH     = 0.34
	var SPEED     = 3.2
	var AMPLITUDE = 0.7
	
	ctx.beginPath()
		for ( var i = 0, n = flippers.length; i < n; i++ ) {
			var a = flippers[i].angle
			var e = 1 - flippers[i].flipProgress
			
			var base0 = Vector2( p0.x + ( Math.cos( a ) * r0 ), p0.y + ( Math.sin( a ) * r0 ) )
			var base1 = Vector2( p0.x + ( Math.cos( a - WIDTH ) * r0 ), p0.y + ( Math.sin( a - WIDTH ) * r0 ) )
			var a2 = a + Math.sin( e*e*e * Math2.TAU * SPEED ) * AMPLITUDE * e
			var tip   = Vector2( base0.x + ( Math.cos( a2 ) * ( r0 * LENGTH ) ), base0.y + ( Math.sin( a2 ) * ( r0 * LENGTH ) ) )
			var base2 = Vector2( p0.x + ( Math.cos( a + WIDTH ) * r0 ), p0.y + ( Math.sin( a + WIDTH ) * r0 ) )
			
			ctx.moveTo( base1.x, base1.y )
			ctx.lineTo( tip.x,  tip.y  )
			ctx.lineTo( base2.x, base2.y )
		}
		
		ctx.fillStyle = assets.skinColor
		ctx.fill()
}

function confineNeuronView( neuronView, replicatorPosition, adjustedConfinementRadius ) {
	const deltaP = Vector2.subtract( neuronView.position, replicatorPosition, {} )
	const distance = Vector2.getLength( deltaP )
	
	if ( distance > adjustedConfinementRadius ) {
		const overhang = Vector2.setLength( deltaP, distance - adjustedConfinementRadius, {} )
		Vector2.subtract( neuronView.position, overhang )
	}
}

// TODO precalculate relative anchor points ffs
function anchorNeuronViews() {
	const p0 = this.replicator.position
	const r0 = this.replicator.radius
	
	// anchor flipper neurons
	for ( let flipper of this.replicator.flippers ) {
		const neuronView = this.neuronViews[ flipper.neuron.index ]
		const r1 = r0 * 0.755
		const a1 = flipper.angle
		neuronView.anchor.x = p0.x + Math.cos( a1 ) * r1
		neuronView.anchor.y = p0.y + Math.sin( a1 ) * r1
	}
	
	// anchor receptor neurons
	for ( let receptor of this.replicator.receptors ) {
		const midpoint = Vector2.clone( p0 )
		midpoint.x += Math.cos( receptor.angle ) * r0 * 0.54
		midpoint.y += Math.sin( receptor.angle ) * r0 * 0.54
		
		for ( let i = 0, n = receptor.neurons.length; i < n; i++ ) {
			const neuron = receptor.neurons[ i ]
			const neuronView = this.neuronViews[ neuron.index ]
			
			let angle = receptor.angle
			angle += ( Math.PI * 2 ) * ( i / n )
			
			neuronView.anchor.x = midpoint.x + Math.cos( angle ) * r0 * 0.15
			neuronView.anchor.y = midpoint.y + Math.sin( angle ) * r0 * 0.15
		}
	}
	
	// anchor hunger neuron
	{
		const hungerView = this.neuronViews[ this.replicator.hungerNeuron.index ]
		
		const r1 = r0 * 0.19
		
		hungerView.anchor.x = p0.x + Math.cos( Math.PI / 2 ) * r1
		hungerView.anchor.y = p0.y + Math.sin( Math.PI / 2 ) * r1
	}
}

export default function ReplicatorView( replicator ) {
	const self = Object.create( ReplicatorView.prototype )
	
	self.replicator = replicator
	
	self.neuronViews = []
	
	for ( let flipper of replicator.flippers ) {
		self.neuronViews[ flipper.neuron.index ] = NeuronView( flipper.neuron, 'flipper' )
	}
	
	for ( let receptor of replicator.receptors ) {
		let neuron
		
		neuron = receptor.neurons.replicator
		self.neuronViews[ neuron.index ] = NeuronView( neuron, 'replicator' )
		
		neuron = receptor.neurons.predator
		self.neuronViews[ neuron.index ] = NeuronView( neuron, 'predator' )
		
		neuron = receptor.neurons.food
		self.neuronViews[ neuron.index ] = NeuronView( neuron, 'food' )
	}
	
	self.neuronViews[ replicator.hungerNeuron.index ] = NeuronView( replicator.hungerNeuron, 'empty' )
	
	// for drawing energy level
	self._apparentEnergy = replicator.energy
	self._slosh = Math.random() * Math2.TAU
	
	// active effects
	self.effects = {}
	// energy up effect is stackable
	self.effects.energyUps = []
	
	/* replicator.on( 'replicated', () => {
		// energy up effect is distracting during replication
		// maybe other effects too?
		self.effects = {}
		self.effects.energyUps = []
	} ) */
	
	return self
}

const distort = x => 0.5 * Math.cos( ( x - 1 ) * Math.PI ) + 0.5

ReplicatorView.prototype = {
	doEnergyUpEffect() {
		return new Promise( resolve => {
			const onDone = ( which ) => {
				const i = this.effects.energyUps.indexOf( which )
				this.effects.energyUps.splice( i, 1 )
				
				resolve()
			}
			
			this.effects.energyUps.push( assets.EnergyUpEffect( 0.4, onDone ) )
		} )
	},
	
	showDeath() {
		return new Promise()
	},
	
	doDeathEffect() {
		return new Promise( resolve => resolve() )
	},
	
	update: function ( dt, dt2 ) {
		const p0 = this.replicator.position
		const r0 = this.replicator.radius
		
		anchorNeuronViews.call( this )
		
		// leave a little bit of space between neurons and the outer wall
		const confinementRadius = r0 * 0.9
		
		for ( let neuronView of this.neuronViews ) {
			neuronView.update( dt, dt2 )
			confineNeuronView( neuronView, p0, confinementRadius - neuronView.radius )
		}
		
		this._apparentEnergy += ( this.replicator.energy - this._apparentEnergy ) * 9 * dt2
		this._slosh = ( this._slosh + ( 0.51 * dt2 ) ) % Math2.TAU
		
		for ( let key of Object.keys( this.effects ) ) {
			if ( key === 'energyUps' ) {
				for ( let effect of this.effects[ key ] ) effect.update( dt, dt2 )
			} else {
				this.effects[ key ].update( dt, dt2 )
			}
		}
	},
	
	drawWithFisheye: function ( ctx, mousePos_world, detail ) {
		const focusTargets = []
		
		for ( let view of this.neuronViews ) {
			const offset = Vector2.subtract( mousePos_world, view.position, {} )
			const distance = Vector2.getLength( offset )
			const collisionRadius = 16
			
			if ( distance < collisionRadius ) {
				focusTargets.push( view )
				
				view.originalPosition = Vector2.clone( view.position )
				Vector2.subtract( view.position, Vector2.scale( offset, distort( 1 - distance / collisionRadius ), {} ) )
				
				view.originalRadius = view.radius
				view.radius += view.radius * distort( 1 - distance / collisionRadius )
			}
		}
		
		this.draw( ctx, detail )
		
		for ( let focusTarget of focusTargets ) {
			Vector2.set( focusTarget.position, focusTarget.originalPosition )
			focusTarget.radius = focusTarget.originalRadius
		}
	},
	
	// TODO add level-of-detail parameter to (some) draw methods
	// here, maybe don't draw connections when detail < 1.0
	draw: function ( ctx, detail ) {
		const replicator = this.replicator
		const p0 = replicator.position
		const r0 = replicator.radius
		
		// backside
		ctx.beginPath()
			ctx.translate( p0.x, p0.y )
			ctx.scale( r0, r0 )
			
			ctx.arc( 0, 0, 1, 0, Math2.TAU )
			ctx.fillStyle = assets.backsideGradient
			ctx.fill()
			
			ctx.scale( 1 / r0, 1 / r0 )
			ctx.translate( -p0.x, -p0.y )
		
		drawConnections( ctx, this.neuronViews, detail )
		
		// flipper connections
		for ( let flipper of this.replicator.flippers ) {
			if ( flipper.neuron.firing ) {
				const neuronView = this.neuronViews[ flipper.neuron.index ]
				const r1 = r0
				const a1 = flipper.angle
				const flipperPosition = {
					x: p0.x + Math.cos( a1 ) * r1,
					y: p0.y + Math.sin( a1 ) * r1,
				}
				
				drawConnection( ctx, neuronView.position, neuronView.radius, flipperPosition, 3, 1, 1 - flipper.neuron.potential )
			}
		}
		
		// receptor connections
		for ( let receptor of this.replicator.receptors ) {
			const receptorPosition = { x: 0, y: 0 }
			receptorPosition.x = p0.x + Math.cos( receptor.angle ) * r0
			receptorPosition.y = p0.y + Math.sin( receptor.angle ) * r0
			
			// food
			{
				const neuron = receptor.neurons.food
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				
				drawConnection( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress )
			}
			
			// other replicators
			{
				const neuron = receptor.neurons.replicator
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				
				drawConnection( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress )
			}
			
			// predators
			{
				const neuron = receptor.neurons.predator
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				
				drawConnection( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress )
			}
		}
		
		// hunger neuron connection
		{
			const neuron = this.replicator.hungerNeuron
			const neuronView = this.neuronViews[ neuron.index ]
			const weight = neuron.weights[ neuron.index ]
			const progress = neuron.sensoryPotential / weight % 1
			
			drawConnection( ctx, p0, 0, neuronView.position, neuronView.radius, weight, progress )
		}
		
		// neurons
		for ( let neuronView of this.neuronViews ) {
			neuronView.draw( ctx, detail )
		}
		
		drawFlippers( ctx, replicator )
		
		// TODO clean up parameters
		drawEnergyLevel( ctx, p0.x, p0.y, r0 - 2.8/2, this._apparentEnergy, this._slosh, this.effects )
		
		{
			// const ga = ctx.globalAlpha
			// ctx.globalAlpha = 0.666
			ctx.drawImage( assets.face, p0.x - r0, p0.y - r0, r0 * 2, r0 * 2 )
			// ctx.globalAlpha = ga
		}
		
		// draw membrane with visible pores
		{
			// one chemoreceptor per body segment
			const n = this.replicator.numBodySegments
			// angular offset of chemoreceptors
			const offset = this.replicator.receptorOffset
			// to visualize pores in cell membrane
			const gap = 0.062
			
			const cx = this.replicator.position.x
			const cy = this.replicator.position.y
			
			ctx.strokeStyle = assets.skinColor
			// ctx.strokeStyle = 'rgba( 255, 255, 255, 0.5 )'
			ctx.lineWidth = 2.9
			ctx.lineCap = 'butt'
			
			// TODO possible to do with one stroke?
			for ( var i = 0; i < n; i++ ) {
				ctx.beginPath()
					// define arc between adjacent receptors, allowing for transmembrane channels
					const startAngle = offset + (   i       / n * Math2.TAU ) + ( gap / 2 )
					const endAngle   = offset + ( ( i + 1 ) / n * Math2.TAU ) - ( gap / 2 )
					
					ctx.arc( cx, cy, this.replicator.radius, startAngle, endAngle )
					ctx.stroke()
			}
			
			// TODO shallower notches
			ctx.beginPath()
				ctx.arc( cx, cy, this.replicator.radius - ctx.lineWidth/4, 0, Math.PI * 2 )
				ctx.lineWidth /= 2
				ctx.stroke()
		}
	},
}
