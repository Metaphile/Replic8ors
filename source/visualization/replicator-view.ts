import config from '../config'
import * as preyAssets from './prey-assets'
import * as predatorAssets from './predator-assets'
import NeuronView from './neuron-view'
import Vector2 from '../engine/vector-2'

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
	const a0 = this.replicator.rotation
	
	// anchor flipper neurons
	for ( const flipper of this.replicator.flippers ) {
		const neuronView = this.neuronViews[ flipper.neuron.index ]
		const r1 = r0 * 0.73
		const a1 = flipper.angle
		neuronView.anchor.x = p0.x + Math.cos( a0 + a1 ) * r1
		neuronView.anchor.y = p0.y + Math.sin( a0 + a1 ) * r1
	}
	
	// anchor receptor neurons
	for ( let j = 0, jn = this.replicator.receptors.length; j < jn; j++ ) {
		const receptor = this.replicator.receptors[ j ]
		
		const deltaAngle = 0.37
		const radius = r0 * 0.73
		
		const startAngle = a0 + receptor.angle + ( ( receptor.neurons.length - 1 ) * deltaAngle / 2 )
		
		for ( let i = 0, n = receptor.neurons.length; i < n; i++ ) {
			const neuron = receptor.neurons[ i ]
			const neuronView = this.neuronViews[ neuron.index ]
			
			neuronView.anchor.x = p0.x + Math.cos( startAngle - ( i * deltaAngle ) ) * radius
			neuronView.anchor.y = p0.y + Math.sin( startAngle - ( i * deltaAngle ) ) * radius
		}
	}
	
	// anchor hunger neuron
	{
		const hungerView = this.neuronViews[ this.replicator.hungerNeuron.index ]
		
		const r1 = r0 * 0
		
		hungerView.anchor.x = p0.x + Math.cos( a0 + Math.PI / 2 ) * r1
		hungerView.anchor.y = p0.y + Math.sin( a0 + Math.PI / 2 ) * r1
	}
	
	// think neurons
	{
		const r1 = r0 * 0.3
		const { numInternalNeurons } = this.replicator
		let angle = ( numInternalNeurons % 2 === 0 ) ? a0 : a0 + Math.PI/2
		for ( const thinkNeuron of this.replicator.thinkNeurons ) {
			const thinkView = this.neuronViews[ thinkNeuron.index ]
			thinkView.anchor.x = p0.x + Math.cos( angle ) * r1
			thinkView.anchor.y = p0.y + Math.sin( angle ) * r1
			angle += Math.PI * 2 / this.replicator.thinkNeurons.length
		}
	}
}

export default function ReplicatorView( replicator, opts = {}, theme = 'prey' ) {
	const self = Object.create( ReplicatorView.prototype )
	self.opts = opts
	
	switch ( theme ) {
		case 'predator':
			self.assets = predatorAssets
			break
		
		default:
			self.assets = preyAssets
			break
	}
	
	self.replicator = replicator
	
	self.neuronViews = []
	
	for ( const flipper of replicator.flippers ) {
		self.neuronViews[ flipper.neuron.index ] = NeuronView( flipper.neuron, 'flipper' )
	}
	
	for ( const receptor of replicator.receptors ) {
		let neuron
		
		neuron = receptor.neurons.prey
		self.neuronViews[ neuron.index ] = NeuronView( neuron, 'prey' )
		
		neuron = receptor.neurons.predator
		self.neuronViews[ neuron.index ] = NeuronView( neuron, 'predator' )
		
		neuron = receptor.neurons.food
		self.neuronViews[ neuron.index ] = NeuronView( neuron, 'food' )
	}
	
	self.neuronViews[ replicator.hungerNeuron.index ] = NeuronView( replicator.hungerNeuron, 'empty' )
	for ( const thinkNeuron of replicator.thinkNeurons ) {
		self.neuronViews[ thinkNeuron.index ] = NeuronView( thinkNeuron, 'think' )
	}
	
	// initialize neuron view positions to their anchor points
	anchorNeuronViews.call( self )
	self.neuronViews.forEach( view => Vector2.set( view.position, view.anchor ) )
	
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
			this.effects.energyUps.push( this.assets.EnergyUpEffect( 0.8, onDone ) )
		} )
	},
	
	doDamageEffect() {
		return new Promise( resolve => {
			const onDone = () => {
				this.effects.damage = null
				resolve()
			}
			
			this.effects.damage = this.assets.DamageEffect( onDone )
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
			
			this.effects.death = this.assets.DeathEffect( onDone )
		} )
	},
	
	update( dt_real, dt_sim ) {
		const p0 = this.replicator.position
		const r0 = this.replicator.radius
		
		anchorNeuronViews.call( this )
		
		// leave a little bit of space between neurons and the outer wall
		const confinementRadius = r0 * 0.9
		
		for ( const neuronView of this.neuronViews ) {
			neuronView.update( dt_real, dt_sim )
			confineNeuronView( neuronView, p0, confinementRadius - neuronView.radius )
		}
		
		this._apparentEnergy += ( this.replicator.energy - this._apparentEnergy ) * 9 * dt_sim
		this._slosh = ( this._slosh + ( 0.51 * dt_sim ) ) % ( Math.PI * 2 )
		
		for ( const effect of this.effects.energyUps ) effect.update( dt_real, dt_sim )
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
		
		// dead replicators are removed immediately from the world and no longer updated,
		// but the view persists for a second or two while the death animation plays out
		// for looks, we manually update the flippers and physics
		if ( this.replicator.dead ) {
			for ( const flipper of this.replicator.flippers ) flipper.update( dt_sim )
			this.replicator.updatePhysics( dt_sim )
		}
	},
	
	drawWithFisheye( ctx, camera, mousePos_world, detail ) {
		const hoverTargets = []
		
		for ( const view of this.neuronViews ) {
			const offset = Vector2.subtract( mousePos_world, view.position, {} )
			const distance = Vector2.getLength( offset )
			const fisheyeStartDist = 14
			
			if ( distance < fisheyeStartDist ) {
				hoverTargets.push( view )
				
				const distortion = 0.5 * ( 1 + distort( 1 - distance / fisheyeStartDist ) ) // 0..1
				
				view.originalPosition = Object.assign( {}, view.position )
				Vector2.subtract( view.position, Vector2.scale( offset, 1.2 * distortion, {} ) )
				
				view.originalRadius = view.radius
				view.radius += view.radius * 1.0 * distortion
				
				// highlight hover neuron(s) and incoming/outgoing signals; hide other traffic
				
				const distortedOffset = Vector2.subtract( mousePos_world, view.position, {} )
				const distortedDistance = Vector2.getLength( distortedOffset )
				
				if ( distortedDistance < view.radius ) {
					view.connectionOpacity = 1
					view.overrideSignalOpacity = true
					// multiple neurons can be active hover targets and that's OK
					view.active = true
				} else {
					view.connectionOpacity = 0.0
					view.overrideSignalOpacity = false
					view.active = false
				}
			} else {
				view.connectionOpacity = 0.0
				view.overrideSignalOpacity = false
				view.active = false
			}
		}
		
		// if no hover neurons, use default opacity rules
		if ( this.neuronViews.filter( view => view.active ).length === 0 ) {
			for ( const view of this.neuronViews ) {
				view.connectionOpacity = 1
				view.overrideSignalOpacity = false
			}
		}
		
		this.draw( ctx, camera, detail, true )
		
		for ( const hoverTarget of hoverTargets ) {
			Vector2.set( hoverTarget.position, hoverTarget.originalPosition )
			hoverTarget.radius = hoverTarget.originalRadius
		}
		
		for ( const view of this.neuronViews ) {
			view.connectionOpacity = 1
		}
	},
	
	drawBackside( ctx ) {
		const { position, radius } = this.replicator
		
		ctx.savePartial( 'fillStyle' )
		
		ctx.beginPath()
			ctx.translate( position.x, position.y )
			ctx.scale( radius, radius )
			
			ctx.arc( 0, 0, 1, 0, Math.PI * 2 )
			ctx.fillStyle = this.assets.backsideGradient
			ctx.fill()
			
			ctx.scale( 1 / radius, 1 / radius )
			ctx.translate( -position.x, -position.y )
		
		ctx.restorePartial()
	},
	
	// indicate symmetric/free sections
	drawSeparators( ctx ) {
		const separatorDistance = 0.365 // distance from center
		const numTines = 3
		const tineLength = 0.1
		
		const replicator = this.replicator
		
		ctx.savePartial( 'lineWidth', 'strokeStyle' )
		
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
		
		ctx.restorePartial()
	},
	
	drawSignals( ctx ) {
		const numNeuronViews = this.neuronViews.length
		const a0 = this.replicator.rotation
		
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
						ctx.globalAlpha * Math.max( neuronViewI.connectionOpacity, neuronViewJ.connectionOpacity ),
						neuronViewI.overrideSignalOpacity || neuronViewJ.overrideSignalOpacity )
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
						ctx.globalAlpha * Math.max( neuronViewI.connectionOpacity, neuronViewJ.connectionOpacity ),
						neuronViewI.overrideSignalOpacity || neuronViewJ.overrideSignalOpacity )
				}
			}
		}
		
		// flipper signals
		for ( const flipper of this.replicator.flippers ) {
			if ( flipper.neuron.firing ) {
				const neuronView = this.neuronViews[ flipper.neuron.index ]
				const r1 = this.replicator.radius
				const a1 = a0 + flipper.angle
				const flipperPosition = {
					x: this.replicator.position.x + Math.cos( a1 ) * r1,
					y: this.replicator.position.y + Math.sin( a1 ) * r1,
				}
				
				this.drawSignal( ctx, neuronView.position, neuronView.radius, flipperPosition, 3, 1, 1 - flipper.neuron.potential, ctx.globalAlpha * neuronView.connectionOpacity, neuronView.overrideSignalOpacity )
			}
		}
		
		// receptor signals
		for ( const receptor of this.replicator.receptors ) {
			const receptorPosition = { x: 0, y: 0 }
			receptorPosition.x = this.replicator.position.x + Math.cos( a0 + receptor.angle ) * this.replicator.radius
			receptorPosition.y = this.replicator.position.y + Math.sin( a0 + receptor.angle ) * this.replicator.radius
			
			// food
			{
				const neuron = receptor.neurons.food
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				// TODO this is very misleading
				const progress = neuron.sensoryPotential / weight % 1
				
				this.drawSignal( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress, ctx.globalAlpha * neuronView.connectionOpacity, neuronView.overrideSignalOpacity )
			}
			
			// other replicators
			{
				const neuron = receptor.neurons.prey
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				
				this.drawSignal( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress, ctx.globalAlpha * neuronView.connectionOpacity, neuronView.overrideSignalOpacity )
			}
			
			// predators
			{
				const neuron = receptor.neurons.predator
				const neuronView = this.neuronViews[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				
				this.drawSignal( ctx, receptorPosition, 3, neuronView.position, neuronView.radius, weight, progress, ctx.globalAlpha * neuronView.connectionOpacity, neuronView.overrideSignalOpacity )
			}
		}
		
		// hunger neuron signal
		{
			const neuron = this.replicator.hungerNeuron
			const neuronView = this.neuronViews[ neuron.index ]
			const weight = neuron.weights[ neuron.index ]
			const progress = neuron.sensoryPotential / weight % 1
			
			const r = this.replicator
			
			const sourcePos = { x: r.position.x, y: 0 } // y set below
			sourcePos.y = r.position.y + r.radius - r.energy * r.radius * 2
			
			this.drawSignal( ctx, sourcePos, 0, neuronView.position, neuronView.radius, weight, progress, ctx.globalAlpha * neuronView.connectionOpacity, neuronView.overrideSignalOpacity )
		}
	},
	
	drawSignal( ctx, a_center, a_radius, b_center, b_radius, weight, progress, baseOpacity, hoverOverride ) {
		// it is a silly number
		if ( weight === 0 ) return
		
		// 1D
		
		const edge2EdgeDist = Math.abs( Vector2.distance( a_center, b_center ) - a_radius - b_radius )
		// MAYBE signal should never start at 0; scale progress to 0.1..1.0
		const signalStartDist = Math.pow( progress, 1/4 ) * edge2EdgeDist
		
		const signalWidth = Math.abs( weight ) * 1.0
		const guideWidth = signalWidth * 0.2
		
		// 2D
		
		// angle of vector from a to b
		const abAngle = Vector2.angle( Vector2.subtract( b_center, a_center, {} ) )
		const baAngle = abAngle + Math.PI
		
		// MAYBE embed start and end points by width/2
		const startPoint = {
			x: a_center.x + Math.cos( abAngle ) * a_radius,
			y: a_center.y + Math.sin( abAngle ) * a_radius,
		}
		
		const endPoint = {
			x: b_center.x + Math.cos( baAngle ) * b_radius,
			y: b_center.y + Math.sin( baAngle ) * b_radius,
		}
		
		const midpoint = {
			x: startPoint.x + Math.cos( abAngle ) * signalStartDist,
			y: startPoint.y + Math.sin( abAngle ) * signalStartDist,
		}
		
		// draw
		
		const ctx_globalAlpha = ctx.globalAlpha
		const ctx_globalCompositeOperation = ctx.globalCompositeOperation
		
		ctx.globalAlpha = hoverOverride ? baseOpacity : baseOpacity * Math.pow( 1 - progress, 1 )
		// 'source-over' is default GCO
		ctx.globalCompositeOperation = weight < 0 ? config.inhibitoryCompositeOperation : config.excitatoryCompositeOperation
		
		ctx.strokeStyle = weight < 0 ? config.inhibitoryColor : config.excitatoryColor
		
		ctx.beginPath()
			ctx.moveTo( startPoint.x, startPoint.y )
			ctx.lineTo( midpoint.x, midpoint.y )
			
			ctx.lineWidth = guideWidth
			ctx.stroke()
		
		ctx.beginPath()
			ctx.moveTo( midpoint.x, midpoint.y )
			ctx.lineTo( endPoint.x, endPoint.y )
			
			ctx.lineWidth = signalWidth
			ctx.stroke()
		
		ctx.globalAlpha = ctx_globalAlpha
		ctx.globalCompositeOperation = ctx_globalCompositeOperation
	},
	
	drawEnergy( ctx ) {
		ctx.savePartial( 'fillStyle', 'globalCompositeOperation' )
		
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
			
			ctx.globalCompositeOperation = 'darken'
			ctx.fillStyle = this.assets.energyGradient
			ctx.fill()
			
			// energyUp expects a pretransformed canvas
			for ( const energyUp of this.effects.energyUps ) {
				energyUp.draw( ctx, energyOffsetY )
			}
			
			// manually restore canvas state
			ctx.rotate( -sloshAngle )
			ctx.translate( 0, -energyOffsetY )
			ctx.scale( 1 / radius, 1 / radius )
			ctx.translate( -position.x, -position.y )
		
		ctx.restorePartial()
	},
	
	drawFlippers( ctx ) {
		const speed     =   2.6
		const amplitude =   0.6
		
		const length    =   0.48
		const lengthMid =   8.4
		const baseAngle =   0.26 * Math.PI
		const tilt      =   0.0
		
		const replicator = this.replicator
		
		ctx.savePartial( 'fillStyle' )
		
		ctx.beginPath()
			ctx.translate( replicator.position.x, replicator.position.y )
			
			for ( let i = 0; i < replicator.flippers.length; i++ ) {
				const flipper = replicator.flippers[ i ]
				
				const flipperBase = Vector2( Math.cos( flipper.angle ) * ( replicator.radius - 1.3 ), Math.sin( flipper.angle ) * ( replicator.radius - 1.3 ) )
				
				ctx.translate( flipperBase.x, flipperBase.y )
				
				const q = 1 - flipper.flipProgress
				const flipAngle = Math.sin( Math.pow( q, 3 ) * Math.PI * 2 * speed ) * amplitude * q
				
				ctx.rotate( flipper.angle + tilt )
				
				// rotate base less than tip so flippers look rubbery
				ctx.rotate( flipAngle * 0.5 )
				ctx.moveTo( Math.cos( -baseAngle ) * lengthMid, Math.sin( -baseAngle ) * lengthMid ) // base, left
				ctx.lineTo( 0, 0 ) // base, middle
				ctx.lineTo( Math.cos(  baseAngle ) * lengthMid, Math.sin(  baseAngle ) * lengthMid ) // base, right
				
				ctx.rotate( flipAngle * 0.5 )
				ctx.lineTo( replicator.radius * length, 0 ) // tip
				
				// this isn't necessary
				// ctx.closePath()
				
				// manually undo transforms
				ctx.rotate( -( flipper.angle + tilt + flipAngle ) )
				ctx.translate( -flipperBase.x, -flipperBase.y )
			}
			
			ctx.fillStyle = this.assets.skinColor
			ctx.fill()
			
			ctx.translate( -replicator.position.x, -replicator.position.y )
		
		ctx.restorePartial()
	},
	
	drawEdge( ctx ) {
		// one chemoreceptor per body segment
		const n = this.replicator.numBodySegments
		// angular offset of chemoreceptors
		const offset = this.replicator.receptorOffset
		// to visualize pores in cell membrane
		const gap = 0.16
		
		const cx = this.replicator.position.x
		const cy = this.replicator.position.y
		
		ctx.savePartial( 'lineCap', 'lineWidth', 'strokeStyle' )
		
		ctx.strokeStyle = this.assets.skinColor
		ctx.lineWidth = 2.9
		ctx.lineCap = 'butt' // heh
		
		{
			const receptors = this.replicator.receptors
			
			for ( let i = 0; i < receptors.length; i++ ) {
				ctx.beginPath()
					const startAngle = receptors[ i ].angle + ( gap / 2 )
					const endAngle   = receptors[ ( i + 1 ) % receptors.length ].angle - ( gap / 2 )
					
					ctx.arc( cx, cy, this.replicator.radius, startAngle, endAngle )
					ctx.stroke()
			}
		}
		
		// TODO shallower notches
		ctx.beginPath()
			ctx.arc( cx, cy, this.replicator.radius - ctx.lineWidth/4, 0, Math.PI * 2 )
			ctx.lineWidth /= 2
			ctx.stroke()
		
		ctx.restorePartial()
	},
	
	draw( ctx, camera, detail, keepHoverOverride ) {
		ctx.savePartial( 'fillStyle', 'globalAlpha', 'globalCompositeOperation' )
		
		if ( this.effects.death ) {
			ctx.globalCompositeOperation = 'screen'
			ctx.globalAlpha = 1 - this.effects.death.progress
		}
		
		if ( !keepHoverOverride ) {
			for ( const view of this.neuronViews ) {
				view.overrideSignalOpacity = false
			}
		}
		
		const replicator = this.replicator
		const p0 = replicator.position
		const r0 = replicator.radius
		
		this.drawBackside( ctx )
		
		// rotate (some parts) with replicator
		ctx.translate( p0.x, p0.y )
		ctx.rotate( this.replicator.rotation )
		ctx.translate( -p0.x, -p0.y )
		
		// this.drawSeparators( ctx )
		
		if ( this.effects.damage ) {
			this.effects.damage.draw( ctx, this.replicator.position, this.replicator.radius )
		}
		
		ctx.translate( p0.x, p0.y )
		ctx.rotate( -this.replicator.rotation )
		ctx.translate( -p0.x, -p0.y )
		
		// for performance, only draw signals while mouseover
		if ( keepHoverOverride ) {
			this.drawSignals( ctx )
		}
		
		// draw neurons
		for ( const neuronView of this.neuronViews ) {
			neuronView.draw( ctx, detail )
		}
		
		// fade energy on hover
		// TODO smooth transition
		{
			let oldGlobalAlpha
			
			if ( keepHoverOverride ) {
				oldGlobalAlpha = ctx.globalAlpha
				ctx.globalAlpha *= 0.3
			}
			
			this.drawEnergy( ctx )
			
			// draw glossy face
			ctx.drawImage( this.assets.face, p0.x - r0, p0.y - r0, r0 * 2, r0 * 2 )
			
			if ( keepHoverOverride ) {
				ctx.globalAlpha = oldGlobalAlpha
			}
		}
		
		ctx.translate( p0.x, p0.y )
		ctx.rotate( this.replicator.rotation )
		ctx.translate( -p0.x, -p0.y )
		
		this.drawFlippers( ctx )
		
		this.drawEdge( ctx )
		
		if ( this.effects.death ) {
			ctx.beginPath()
				ctx.arc( this.replicator.position.x, this.replicator.position.y, this.replicator.radius - 2.9/2, 0, Math.PI * 2 )
				ctx.fillStyle = 'orange'
				ctx.fill()
		}
		
		ctx.restorePartial()
	},
}