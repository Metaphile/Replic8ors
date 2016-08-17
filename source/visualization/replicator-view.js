// TODO initial position for neuron views
// apply constant repulsive force; let springiness and collisions do their thing

import * as assets from './replicator-assets'
import { drawConnections, drawConnection } from './replicator-view-internals'
import NeuronView from './neuron-view'
import Math2 from '../engine/math-2'
import Vector2 from '../engine/vector-2'
import Timer from '../engine/timer'

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
		
		for ( let effect of effects.energyDowns ) effect.draw( ctx, energy )
		
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
		midpoint.x += Math.cos( receptor.angle ) * r0 * 0.615
		midpoint.y += Math.sin( receptor.angle ) * r0 * 0.615
		
		for ( let i = 0, n = receptor.neurons.length; i < n; i++ ) {
			const neuron = receptor.neurons[ i ]
			const neuronView = this.neuronViews[ neuron.index ]
			
			let angle = receptor.angle
			angle += ( Math.PI * 2 ) * ( i / n )
			
			neuronView.anchor.x = midpoint.x + Math.cos( angle ) * r0 * 0.14
			neuronView.anchor.y = midpoint.y + Math.sin( angle ) * r0 * 0.14
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
	// energy up/down effects are stackable
	self.effects.energyUps = []
	self.effects.energyDowns = []
	
	/* replicator.on( 'replicated', () => {
		// energy up effect is distracting during replication
		// maybe other effects too?
		self.effects = {}
		self.effects.energyUps = []
	} ) */
	
	self.timer = Timer()
	self.timer.setAlarm( Math.random() * 1, () => self.doEnergyDownEffect() )
	
	return self
}

const distort = x => Math.cos( ( x - 1 ) * Math.PI )

ReplicatorView.prototype = {
	doEnergyUpEffect() {
		return new Promise( resolve => {
			const onDone = ( which ) => {
				const i = this.effects.energyUps.indexOf( which )
				this.effects.energyUps.splice( i, 1 )
				
				resolve()
			}
			
			// TODO check for energy downs?
			this.effects.energyUps.push( assets.EnergyUpEffect( 0.4, onDone ) )
		} )
	},
	
	doEnergyDownEffect() {
		return new Promise( resolve => {
			const onDone = ( which ) => {
				const i = this.effects.energyDowns.indexOf( which )
				this.effects.energyDowns.splice( i, 1 )
				
				this.timer.setAlarm( 2, () => {
					this.effects.energyDowns.push( assets.EnergyDownEffect( 1, onDone ) )
				} )
				
				resolve()
			}
			
			// TODO check for energy ups?
			this.effects.energyDowns.push( assets.EnergyDownEffect( 1, onDone ) )
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
		
		for ( let effect of this.effects.energyDowns ) effect.update( dt, dt2 )
		for ( let effect of this.effects.energyUps ) effect.update( dt, dt2 )
		
		this.timer.update( dt2 )
	},
	
	drawWithFisheye: function ( ctx, mousePos_world, detail ) {
		// TODO fade life juice?
		
		const hoverTargets = []
		
		for ( let view of this.neuronViews ) {
			const offset = Vector2.subtract( mousePos_world, view.position, {} )
			const distance = Vector2.getLength( offset )
			const collisionRadius = 13
			
			if ( distance < collisionRadius ) {
				hoverTargets.push( view )
				
				const distortion = 0.5 * ( 1 + distort( 1 - distance / collisionRadius ) ) // 0..1
				
				view.originalPosition = Vector2.clone( view.position )
				Vector2.subtract( view.position, Vector2.scale( offset, 1.2 * distortion, {} ) )
				
				view.originalRadius = view.radius
				view.radius += view.radius * 0.6 * distortion
				
				view.connectionOpacity = distortion
			} else {
				view.connectionOpacity = 0
			}
		}
		
		this.draw( ctx, detail )
		
		for ( let hoverTarget of hoverTargets ) {
			Vector2.set( hoverTarget.position, hoverTarget.originalPosition )
			hoverTarget.radius = hoverTarget.originalRadius
		}
		
		for ( let view of this.neuronViews ) {
			view.connectionOpacity = 1
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
		
		// indicate symmetric/free sections
		ctx.lineWidth = 0.27
		ctx.strokeStyle = 'rgba(  90, 195, 255, 0.18 )'
		// ctx.globalCompositeOperation = 'screen'
		for ( let i = 0; i < replicator.numBodySegments; i++ ) {
			ctx.beginPath()
				let angle = 0
				angle += replicator.flipperOffset
				angle += i / replicator.numBodySegments * Math.PI * 2
				
				const p1 = {}
				p1.x = p0.x + Math.cos( angle ) * replicator.radius * 0.455
				p1.y = p0.y + Math.sin( angle ) * replicator.radius * 0.455
				
				const p2 = {}
				p2.x = p1.x + Math.cos( angle ) * replicator.radius * 0.1
				p2.y = p1.y + Math.sin( angle ) * replicator.radius * 0.1
				
				const p3 = {}
				angle += Math.PI * 2 / 3
				p3.x = p1.x + Math.cos( angle ) * replicator.radius * 0.1
				p3.y = p1.y + Math.sin( angle ) * replicator.radius * 0.1
				
				const p4 = {}
				angle += Math.PI * 2 / 3
				p4.x = p1.x + Math.cos( angle ) * replicator.radius * 0.1
				p4.y = p1.y + Math.sin( angle ) * replicator.radius * 0.1
				
				ctx.moveTo( p1.x, p1.y )
				ctx.lineTo( p2.x, p2.y )
				
				ctx.moveTo( p1.x, p1.y )
				ctx.lineTo( p3.x, p3.y )
				
				ctx.moveTo( p1.x, p1.y )
				ctx.lineTo( p4.x, p4.y )
				
				ctx.stroke()
		}
		
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
				
				drawConnection( ctx, neuronView.position, neuronView.radius, flipperPosition, 3, 1, 1 - flipper.neuron.potential, neuronView.connectionOpacity )
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
				// TODO this is very misleading
				const progress = neuron.sensoryPotential / weight % 1
				
				drawConnection( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress, neuronView.connectionOpacity )
			}
			
			// other replicators
			{
				const neuron = receptor.neurons.replicator
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				
				drawConnection( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress, neuronView.connectionOpacity )
			}
			
			// predators
			{
				const neuron = receptor.neurons.predator
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				
				drawConnection( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress, neuronView.connectionOpacity )
			}
		}
		
		// hunger neuron connection
		{
			const neuron = this.replicator.hungerNeuron
			const neuronView = this.neuronViews[ neuron.index ]
			const weight = neuron.weights[ neuron.index ]
			const progress = neuron.sensoryPotential / weight % 1
			
			drawConnection( ctx, p0, 0, neuronView.position, neuronView.radius, weight, progress, neuronView.connectionOpacity )
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
