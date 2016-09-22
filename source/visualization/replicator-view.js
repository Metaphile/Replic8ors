// TODO initial position for neuron views
// apply constant repulsive force; let springiness and collisions do their thing

import * as assets from './replicator-assets'
import NeuronView from './neuron-view'
import Vector2 from '../engine/vector-2'

const ourCtx = document.createElement( 'canvas' ).getContext( '2d' )

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
		const r1 = r0 * 0.655
		const a1 = flipper.angle
		neuronView.anchor.x = p0.x + Math.cos( a1 ) * r1
		neuronView.anchor.y = p0.y + Math.sin( a1 ) * r1
	}
	
	// anchor receptor neurons
	for ( let receptor of this.replicator.receptors ) {
		const midpoint = Vector2.clone( p0 )
		midpoint.x += Math.cos( receptor.angle ) * r0 * 0.545
		midpoint.y += Math.sin( receptor.angle ) * r0 * 0.545
		
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
		
		const r1 = r0 * 0.17
		
		hungerView.anchor.x = p0.x + Math.cos( Math.PI / 2 ) * r1
		hungerView.anchor.y = p0.y + Math.sin( Math.PI / 2 ) * r1
	}
	
	// think neurons
	{
		const r1 = r0 * 0.19
		let angle = Math.PI / 2 + Math.PI / 1.5
		for ( let thinkNeuron of this.replicator.thinkNeurons ) {
			const thinkView = this.neuronViews[ thinkNeuron.index ]
			thinkView.anchor.x = p0.x + Math.cos( angle ) * r1
			thinkView.anchor.y = p0.y + Math.sin( angle ) * r1
			angle += Math.PI / 1.5
		}
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
	for ( let thinkNeuron of replicator.thinkNeurons ) {
		self.neuronViews[ thinkNeuron.index ] = NeuronView( thinkNeuron, 'think' )
	}
	
	// for drawing energy level
	self._apparentEnergy = replicator.energy
	self._slosh = Math.random() * Math.PI * 2
	
	// active effects
	self.effects = {}
	// energy up effect is stackable
	self.effects.energyUps = []
	
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
	
	doDamageEffect() {
		return new Promise( resolve => {
			const onDone = () => {
				this.effects.damage = null
				resolve()
			}
			
			this.effects.damage = assets.DamageEffect( onDone )
		} )
	},
	
	doDeathEffect() {
		// TODO cancel other/conflicting effects
		// check replicator.dead before applying effects
		
		return new Promise( resolve => {
			const onDone = () => {
				// this.effects.death = null
				resolve()
			}
			
			this.effects.death = assets.DeathEffect( onDone )
		} )
	},
	
	update( dt_real, dt_sim ) {
		const p0 = this.replicator.position
		const r0 = this.replicator.radius
		
		anchorNeuronViews.call( this )
		
		// leave a little bit of space between neurons and the outer wall
		const confinementRadius = r0 * 0.9
		
		for ( let neuronView of this.neuronViews ) {
			neuronView.update( dt_real, dt_sim )
			confineNeuronView( neuronView, p0, confinementRadius - neuronView.radius )
		}
		
		this._apparentEnergy += ( this.replicator.energy - this._apparentEnergy ) * 9 * dt_sim
		this._slosh = ( this._slosh + ( 0.51 * dt_sim ) ) % ( Math.PI * 2 )
		
		for ( let effect of this.effects.energyUps ) effect.update( dt_real, dt_sim )
		if ( this.effects.damage ) this.effects.damage.update( dt_real, dt_sim )
		if ( this.effects.death ) this.effects.death.update( dt_real, dt_sim )
		
		if ( this.replicator.takingDamage ) {
			// TODO this only works accidentally
			// the effect is added once and never removed
			// need new strategy (active flag?) for effects?
			if ( !this.effects.damage ) {
				this.doDamageEffect()
			}
			
			// while replicator is actively taking damage, keep damage animation on first frame
			// when damage stops, allow damage animation to play out (fade out)
			this.effects.damage.progress = 0
		}
	},
	
	drawWithFisheye( theirCtx, camera, mousePos_world, detail ) {
		// TODO fade life juice?
		
		const hoverTargets = []
		
		for ( let view of this.neuronViews ) {
			const offset = Vector2.subtract( mousePos_world, view.position, {} )
			const distance = Vector2.getLength( offset )
			const collisionRadius = 14
			
			if ( distance < collisionRadius ) {
				hoverTargets.push( view )
				
				const distortion = 0.5 * ( 1 + distort( 1 - distance / collisionRadius ) ) // 0..1
				
				view.originalPosition = Vector2.clone( view.position )
				Vector2.subtract( view.position, Vector2.scale( offset, 1.2 * distortion, {} ) )
				
				view.originalRadius = view.radius
				view.radius += view.radius * 1.0 * distortion
				
				view.connectionOpacity = Math.pow( distortion, 3 )
			} else {
				view.connectionOpacity = 0
			}
		}
		
		this.draw( theirCtx, camera, detail )
		
		for ( let hoverTarget of hoverTargets ) {
			Vector2.set( hoverTarget.position, hoverTarget.originalPosition )
			hoverTarget.radius = hoverTarget.originalRadius
		}
		
		for ( let view of this.neuronViews ) {
			view.connectionOpacity = 1
		}
	},
	
	drawBackside( ctx ) {
		const { position, radius } = this.replicator
		
		ctx.beginPath()
			ctx.translate( position.x, position.y )
			ctx.scale( radius, radius )
			
			ctx.arc( 0, 0, 1, 0, Math.PI * 2 )
			ctx.fillStyle = assets.backsideGradient
			ctx.fill()
			
			ctx.scale( 1 / radius, 1 / radius )
			ctx.translate( -position.x, -position.y )
	},
	
	// indicate symmetric/free sections
	drawSeparators( ctx ) {
		const separatorDistance = 0.365 // distance from center
		const numTines = 3
		const tineLength = 0.1
		
		const replicator = this.replicator
		
		ctx.beginPath()
			ctx.translate( replicator.position.x, replicator.position.y )
			ctx.scale( replicator.radius, replicator.radius )
			
			for ( let i = 0; i < replicator.numBodySegments; i++ ) {
				const separatorAngle = replicator.flipperOffset + ( i / replicator.numBodySegments * Math.PI * 2 )
				const separatorX = Math.cos( separatorAngle ) * separatorDistance
				const separatorY = Math.sin( separatorAngle ) * separatorDistance
				
				for ( let j = 0; j < numTines; j++ ) {
					const tineAngle = separatorAngle + ( j / numTines * Math.PI * 2 )
					ctx.moveTo( separatorX, separatorY )
					ctx.lineTo( separatorX + Math.cos( tineAngle ) * tineLength, separatorY + Math.sin( tineAngle ) * tineLength )
				}
			}
			
			ctx.lineWidth = 0.27 / replicator.radius
			ctx.strokeStyle = 'rgba( 90, 195, 255, 0.18 )'
			ctx.stroke()
			
			ctx.scale( 1 / replicator.radius, 1 / replicator.radius )
			ctx.translate( -replicator.position.x, -replicator.position.y )
	},
	
	drawSignals( ctx ) {
		const numNeuronViews = this.neuronViews.length
		
		for ( let i = 0; i < numNeuronViews; i++ ) {
			const neuronViewI = this.neuronViews[ i ]
			
			for ( let j = i + 1; j < numNeuronViews; j++ ) {
				const neuronViewJ = this.neuronViews[ j ]
				
				if ( neuronViewI.neuron.firing ) {
					// signal from i to j
					this.drawSignal(
						ctx,
						neuronViewI.position,
						neuronViewI.radius,
						neuronViewJ.position,
						neuronViewJ.radius,
						neuronViewJ.neuron.weights[ neuronViewI.neuron.index ],
						1 - neuronViewI.neuron.potential,
						Math.max( neuronViewI.connectionOpacity, neuronViewJ.connectionOpacity ) )
				}
				
				if ( neuronViewJ.neuron.firing ) {
					// signal from j to i
					this.drawSignal(
						ctx,
						neuronViewJ.position,
						neuronViewJ.radius,
						neuronViewI.position,
						neuronViewI.radius,
						neuronViewI.neuron.weights[ neuronViewJ.neuron.index ],
						1 - neuronViewJ.neuron.potential,
						Math.max( neuronViewI.connectionOpacity, neuronViewJ.connectionOpacity ) )
				}
			}
		}
		
		// flipper signals
		for ( let flipper of this.replicator.flippers ) {
			if ( flipper.neuron.firing ) {
				const neuronView = this.neuronViews[ flipper.neuron.index ]
				const r1 = this.replicator.radius
				const a1 = flipper.angle
				const flipperPosition = {
					x: this.replicator.position.x + Math.cos( a1 ) * r1,
					y: this.replicator.position.y + Math.sin( a1 ) * r1,
				}
				
				this.drawSignal( ctx, neuronView.position, neuronView.radius, flipperPosition, 3, 1, 1 - flipper.neuron.potential, neuronView.connectionOpacity )
			}
		}
		
		// receptor signals
		for ( let receptor of this.replicator.receptors ) {
			const receptorPosition = { x: 0, y: 0 }
			receptorPosition.x = this.replicator.position.x + Math.cos( receptor.angle ) * this.replicator.radius
			receptorPosition.y = this.replicator.position.y + Math.sin( receptor.angle ) * this.replicator.radius
			
			// food
			{
				const neuron = receptor.neurons.food
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				// TODO this is very misleading
				const progress = neuron.sensoryPotential / weight % 1
				
				this.drawSignal( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress, neuronView.connectionOpacity )
			}
			
			// other replicators
			{
				const neuron = receptor.neurons.replicator
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				
				this.drawSignal( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress, neuronView.connectionOpacity )
			}
			
			// predators
			{
				const neuron = receptor.neurons.predator
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				
				this.drawSignal( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress, neuronView.connectionOpacity )
			}
		}
		
		// hunger neuron signal
		{
			const neuron = this.replicator.hungerNeuron
			const neuronView = this.neuronViews[ neuron.index ]
			const weight = neuron.weights[ neuron.index ]
			const progress = neuron.sensoryPotential / weight % 1
			
			this.drawSignal( ctx, this.replicator.position, 0, neuronView.position, neuronView.radius, weight, progress, neuronView.connectionOpacity )
		}
	},
	
	drawSignal( ctx, a_center, a_radius, b_center, b_radius, weight, progress, baseOpacity ) {
		if ( weight === 0 ) return
		
		const excitatoryStyle = 'rgba( 90, 195, 255, 1.0 )'
		const inhibitoryStyle = 'rgba( 190, 0, 0, 0.666 )'
		const maxConnWidth = 0.26
		const minConnWidth = maxConnWidth * 0.08
		
		// vector from a center to b center
		const ab_displacement = Vector2.subtract( b_center, a_center, {} )
		const ab_distance = Vector2.distance( a_center, b_center )
		
		// angle from a center to b center
		const ab_angle = Vector2.angle( ab_displacement )
		// flip 180 degrees
		const ba_angle = ab_angle + Math.PI
		
		
		const b_edgeOffset = minConnWidth + Math.abs( weight ) * ( maxConnWidth - minConnWidth )
		
		const b_edge1 = Vector2.clone( b_center )
		b_edge1.x += Math.cos( ba_angle + b_edgeOffset ) * b_radius
		b_edge1.y += Math.sin( ba_angle + b_edgeOffset ) * b_radius
		
		const b_edge2 = Vector2.clone( b_center )
		b_edge2.x += Math.cos( ba_angle + b_edgeOffset/5 ) * b_radius
		b_edge2.y += Math.sin( ba_angle + b_edgeOffset/5 ) * b_radius
		
		const b_edge3 = Vector2.clone( b_center )
		b_edge3.x += Math.cos( ba_angle - b_edgeOffset/5 ) * b_radius
		b_edge3.y += Math.sin( ba_angle - b_edgeOffset/5 ) * b_radius
		
		const b_edge4 = Vector2.clone( b_center )
		b_edge4.x += Math.cos( ba_angle - b_edgeOffset ) * b_radius
		b_edge4.y += Math.sin( ba_angle - b_edgeOffset ) * b_radius
		
		
		const a_edgeOffset = Vector2.angle( Vector2.subtract( b_edge2, a_center, {} ) ) - ab_angle
		
		const a_edge1 = Vector2.clone( a_center )
		a_edge1.x += Math.cos( ab_angle + a_edgeOffset ) * a_radius
		a_edge1.y += Math.sin( ab_angle + a_edgeOffset ) * a_radius
		
		const a_edge2 = Vector2.clone( a_center )
		a_edge2.x += Math.cos( ab_angle - a_edgeOffset ) * a_radius
		a_edge2.y += Math.sin( ab_angle - a_edgeOffset ) * a_radius
		
		
		const a1b2_displacement = Vector2.subtract( b_edge2, a_edge1, {} )
		const a1b2_distance     = Vector2.distance( b_edge2, a_edge1 )
		
		const a2b3_displacement = Vector2.subtract( b_edge3, a_edge2, {} )
		const a2b3_distance     = Vector2.distance( b_edge3, a_edge2 )
		
		const midpoint1 = Vector2.add( a_edge1, Vector2.scale( a1b2_displacement, Math.pow( progress, 1/4 ), {} ), {} )
		const midpoint2 = Vector2.add( a_edge2, Vector2.scale( a2b3_displacement, Math.pow( progress, 1/4 ), {} ), {} )
		
		
		const ctx_globalAlpha = ctx.globalAlpha
		const ctx_globalCompositeOperation = ctx.globalCompositeOperation
		
		ctx.globalAlpha = baseOpacity * Math.pow( 1 - progress, 1 )
		ctx.globalCompositeOperation = weight < 0 ? 'darken' : 'lighten'
		
		ctx.fillStyle = weight < 0 ? inhibitoryStyle : excitatoryStyle
		
		ctx.beginPath()
			ctx.moveTo( a_edge1.x, a_edge1.y )
			ctx.lineTo( midpoint1.x, midpoint1.y )
			ctx.lineTo( b_edge1.x, b_edge1.y )
			
			ctx.lineTo( b_edge4.x, b_edge4.y )
			ctx.lineTo( midpoint2.x, midpoint2.y )
			ctx.lineTo( a_edge2.x, a_edge2.y )
			
			ctx.fill()
		
		ctx.globalAlpha = ctx_globalAlpha
		ctx.globalCompositeOperation = ctx_globalCompositeOperation
	},
	
	drawEnergy( ctx ) {
		ctx.beginPath()
			const { position, radius } = this.replicator
			
			ctx.translate( position.x, position.y )
			ctx.scale( radius, radius )
			
			ctx.arc( 0, 0, 1, 0, Math.PI * 2 )
			
			const energyOffsetY = 1 - this._apparentEnergy * 2
			ctx.translate( 0, energyOffsetY )
			
			// gently slosh energy
			// we multiply by primes to make the repeating pattern less obvious
			const sloshAngle = 0.008 * ( Math.cos( this._slosh * 7 ) * Math.cos( this._slosh * 13 ) )
			ctx.rotate( sloshAngle )
			
			const ctx_globalCompositeOperation = ctx.globalCompositeOperation
			
			ctx.globalCompositeOperation = 'darken'
			ctx.fillStyle = assets.energyGradient
			ctx.fill()
			
			// energyUp expects a pretransformed canvas
			for ( let energyUp of this.effects.energyUps ) {
				energyUp.draw( ctx, this._apparentEnergy )
			}
			
			// manually restore canvas state
			ctx.globalCompositeOperation = ctx_globalCompositeOperation
			ctx.rotate( -sloshAngle )
			ctx.translate( 0, -energyOffsetY )
			ctx.scale( 1 / radius, 1 / radius )
			ctx.translate( -position.x, -position.y )
	},
	
	drawFlippers( ctx ) {
		const replicator = this.replicator
		
		var p0 = replicator.position
		var r0 = replicator.radius * 1.072
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
				var a2 = a + Math.sin( e*e*e * Math.PI * 2 * SPEED ) * AMPLITUDE * e
				var tip   = Vector2( base0.x + ( Math.cos( a2 ) * ( r0 * LENGTH ) ), base0.y + ( Math.sin( a2 ) * ( r0 * LENGTH ) ) )
				var base2 = Vector2( p0.x + ( Math.cos( a + WIDTH ) * r0 ), p0.y + ( Math.sin( a + WIDTH ) * r0 ) )
				
				ctx.moveTo( base1.x, base1.y )
				ctx.lineTo( tip.x,  tip.y  )
				ctx.lineTo( base2.x, base2.y )
			}
			
			ctx.fillStyle = assets.skinColor
			ctx.fill()
	},
	
	drawEdge( ctx ) {
		// one chemoreceptor per body segment
		const n = this.replicator.numBodySegments
		// angular offset of chemoreceptors
		const offset = this.replicator.receptorOffset
		// to visualize pores in cell membrane
		const gap = 0.062
		
		const cx = this.replicator.position.x
		const cy = this.replicator.position.y
		
		ourCtx.strokeStyle = assets.skinColor
		// ctx.strokeStyle = 'rgba( 255, 255, 255, 0.5 )'
		ourCtx.lineWidth = 2.9
		ourCtx.lineCap = 'butt' // heh
		
		for ( var i = 0; i < n; i++ ) {
			ourCtx.beginPath()
				// define arc between adjacent receptors, allowing for transmembrane channels
				const startAngle = offset + (   i       / n * Math.PI * 2 ) + ( gap / 2 )
				const endAngle   = offset + ( ( i + 1 ) / n * Math.PI * 2 ) - ( gap / 2 )
				
				ourCtx.arc( cx, cy, this.replicator.radius, startAngle, endAngle )
				ourCtx.stroke()
		}
		
		// TODO shallower notches
		ourCtx.beginPath()
			ourCtx.arc( cx, cy, this.replicator.radius - ourCtx.lineWidth/4, 0, Math.PI * 2 )
			ourCtx.lineWidth /= 2
			ourCtx.stroke()
	},
	
	draw( theirCtx, camera, detail ) {
		const replicator = this.replicator
		const p0 = replicator.position
		const r0 = replicator.radius
		
		const zoomLevel = camera.zoomLevel() * 1.1
		ourCtx.canvas.width = ourCtx.canvas.height = ( this.replicator.radius + 16 ) * 2 * zoomLevel
		ourCtx.translate( ourCtx.canvas.width / 2, ourCtx.canvas.width / 2 )
		ourCtx.scale( zoomLevel, zoomLevel )
		ourCtx.translate( -p0.x, -p0.y )
		
		this.drawBackside( ourCtx )
		
		this.drawSeparators( ourCtx )
		
		if ( this.effects.damage ) {
			this.effects.damage.draw( ourCtx, this.replicator.position, this.replicator.radius )
		}
		
		this.drawSignals( ourCtx )
		
		// draw neurons
		for ( let neuronView of this.neuronViews ) {
			neuronView.draw( ourCtx, detail )
		}
		
		this.drawEnergy( ourCtx )
		
		// draw glossy face
		ourCtx.drawImage( assets.face, p0.x - r0, p0.y - r0, r0 * 2, r0 * 2 )
		
		this.drawFlippers( ourCtx )
		
		this.drawEdge( ourCtx )
		
		const theirCtx_globalAlpha = theirCtx.globalAlpha
		if ( this.effects.death ) {
			ourCtx.beginPath()
				ourCtx.arc( this.replicator.position.x, this.replicator.position.y, this.replicator.radius - 2.9/2, 0, Math.PI * 2 )
				ourCtx.fillStyle = 'orange'
				ourCtx.globalCompositeOperation = 'screen'
				ourCtx.fill()
			
			theirCtx.globalAlpha = 1 - this.effects.death.progress
		}
		
		const halfWidth = ourCtx.canvas.width / zoomLevel / 2
		theirCtx.drawImage( ourCtx.canvas, p0.x - halfWidth, p0.y - halfWidth, halfWidth * 2, halfWidth * 2 )
		
		theirCtx.globalAlpha = theirCtx_globalAlpha
	},
}
