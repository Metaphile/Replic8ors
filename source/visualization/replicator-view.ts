import config from '../config'
import * as preyAssets from './prey-assets'
import * as predatorAssets from './predator-assets'
import * as blueAssets from './blue-assets'
import NeuronView from './neuron-view'
import Vector2 from '../engine/vector-2'

export enum SignalPartType {
	ExcitatoryUnchanged = 'ExcitatoryUnchanged',
	ExcitatoryGained    = 'ExcitatoryGained',
	InhibitoryUnchanged = 'InhibitoryUnchanged',
	InhibitoryGained    = 'InhibitoryGained',
}

export type SignalPart = {
	start: number
	end: number
	type: SignalPartType
}

// I thought I would need to memoize this but actual perf tests show otherwise
export const getSignalParts = ( origWeight: number, currWeight: number ): SignalPart[] => {
	const origMidpoint = 1 - ( ( origWeight + 1 ) / 2 )
	const currMidpoint = 1 - ( ( currWeight + 1 ) / 2 )
	
	if ( currWeight > origWeight ) {
		if ( currWeight === 1 && origWeight === -1 ) {
			return [
				{
					start: 0.0,
					end:   1.0,
					type:  SignalPartType.ExcitatoryGained,
				}
			]
		} else {
			return [
				{
					start: 0.0,
					end:   currMidpoint,
					type:  SignalPartType.InhibitoryUnchanged,
				},
				{
					start: currMidpoint,
					end:   origMidpoint,
					type:  SignalPartType.ExcitatoryGained,
				},
				{
					start: origMidpoint,
					end:   1.0,
					type:  SignalPartType.ExcitatoryUnchanged,
				},
			]
		}
	} else if ( currWeight < origWeight ) {
		if ( currWeight === -1 && origWeight === 1 ) {
			return [
				{
					start: 0.0,
					end:   1.0,
					type:  SignalPartType.InhibitoryGained,
				}
			]
		} else {
			return [
				{
					start: 0.0,
					end:   origMidpoint,
					type:  SignalPartType.InhibitoryUnchanged,
				},
				{
					start: origMidpoint,
					end:   currMidpoint,
					type:  SignalPartType.InhibitoryGained,
				},
				{
					start: currMidpoint,
					end:   1.0,
					type:  SignalPartType.ExcitatoryUnchanged,
				},
			]
		}
	} else {
		// current and original weights are the same
		
		if ( currWeight === 1 ) {
			return [
				{
					start: 0.0,
					end:   1.0,
					type:  SignalPartType.ExcitatoryUnchanged,
				}
			]
		} else if ( currWeight === -1 ) {
			return [
				{
					start: 0.0,
					end:   1.0,
					type:  SignalPartType.InhibitoryUnchanged,
				}
			]
		} else {
			return [
				{
					start: 0,
					end:   currMidpoint,
					type:  SignalPartType.InhibitoryUnchanged,
				},
				{
					start: currMidpoint,
					end:   1,
					type:  SignalPartType.ExcitatoryUnchanged,
				},
			]
		}
	}
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
	
	const rPct1 = 0.75
	const rPct2 = 1 - rPct1
	
	const deltaAngle = Math.PI / this.replicator.receptors.length
	
	// anchor flipper neurons
	for ( const flipper of this.replicator.flippers ) {
		const neuronView = this.neuronViews[ flipper.neuron.index ]
		const r1 = r0 * rPct1
		const a1 = flipper.angle
		neuronView.anchor.x = p0.x + Math.cos( a1 ) * r1
		neuronView.anchor.y = p0.y + Math.sin( a1 ) * r1
	}
	
	// anchor receptor neurons
	for ( const receptor of this.replicator.receptors ) {
		const x = p0.x + Math.cos( receptor.angle ) * r0 * ( rPct1 - rPct2 )
		const y = p0.y + Math.sin( receptor.angle ) * r0 * ( rPct1 - rPct2 )
		
		const startAngle = receptor.angle + deltaAngle
		
		for ( let i = 0, n = receptor.neurons.length; i < n; i++ ) {
			const neuronView = this.neuronViews[ receptor.neurons[ i ].index ]
			
			neuronView.anchor.x = x + Math.cos( startAngle - ( i * deltaAngle ) ) * r0 * rPct2
			neuronView.anchor.y = y + Math.sin( startAngle - ( i * deltaAngle ) ) * r0 * rPct2
		}
	}
	
	// anchor hunger neuron
	{
		const hungerView = this.neuronViews[ this.replicator.hungerNeuron.index ]
		
		hungerView.anchor.x = p0.x
		hungerView.anchor.y = p0.y
	}
	
	// think neurons
	{
		const r1 = r0 * rPct2
		const { numInternalNeurons } = this.replicator
		let angle = ( numInternalNeurons % 2 === 0 ) ? 0 : Math.PI/2
		for ( const thinkNeuron of this.replicator.thinkNeurons ) {
			const thinkView = this.neuronViews[ thinkNeuron.index ]
			thinkView.anchor.x = p0.x + Math.cos( angle ) * r1
			thinkView.anchor.y = p0.y + Math.sin( angle ) * r1
			angle += Math.PI * 2 / this.replicator.thinkNeurons.length
		}
	}
}

export default function ReplicatorView( replicator, opts = {} ) {
	const self = Object.create( ReplicatorView.prototype )
	self.opts = opts
	
	switch ( replicator.type ) {
		case 'predator':
			self.assets = predatorAssets
			break
		
		case 'blue':
			self.assets = blueAssets
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
		
		neuron = receptor.neurons.predator
		self.neuronViews[ neuron.index ] = NeuronView( neuron, 'predator' )
		
		neuron = receptor.neurons.prey
		self.neuronViews[ neuron.index ] = NeuronView( neuron, 'prey' )
		
		neuron = receptor.neurons.blue
		self.neuronViews[ neuron.index ] = NeuronView( neuron, 'blue' )
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
	
	self.doSpawnEffect()
	
	replicator.on( 'gained-energy', () => self.doEnergyUpEffect() )
	replicator.on( 'lost-energy', () => self.doDamageEffect() )
	
	return self
}

const distort = x => Math.cos( ( x - 1 ) * Math.PI )

ReplicatorView.prototype = {
	doSpawnEffect() {
		return new Promise( resolve => {
			const onDone = () => {
				this.effects.spawn = null
				resolve()
			}
			
			this.effects.spawn = this.assets.SpawnEffect( onDone )
		} )
	},
	
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
		
		if ( this.effects.spawn ) this.effects.spawn.update( dt_real )
		for ( const effect of this.effects.energyUps ) effect.update( dt_sim )
		if ( this.effects.damage ) this.effects.damage.update( dt_sim )
		if ( this.effects.death ) this.effects.death.update( dt_sim )
		
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
		
		const beginFisheyeLod = 2.9
		// fisheye LoD should end at max zoom
		// (most distortion when fully zoomed in)
		const endFisheyeLod = 18.0
		const distCoeff = Math.min( ( detail - beginFisheyeLod ) / ( endFisheyeLod - beginFisheyeLod ), 1 )
		
		for ( const view of this.neuronViews ) {
			if ( detail < beginFisheyeLod ) break
			
			const offset = Vector2.subtract( mousePos_world, view.position, {} )
			const distance = Vector2.getLength( offset )
			const fisheyeStartDist = 20
			
			if ( distance < fisheyeStartDist ) {
				hoverTargets.push( view )
				
				const distortion = 0.5 * ( 1 + distort( 1 - distance / fisheyeStartDist ) ) * distCoeff // 0..1
				
				view.originalPosition = Object.assign( {}, view.position )
				Vector2.subtract( view.position, Vector2.scale( offset, 1.3 * distortion, {} ) )
				
				view.originalRadius = view.radius
				view.radius += view.radius * 1.3 * distortion
				
				// highlight hover neuron(s) and incoming/outgoing signals; hide other traffic
				
				const distortedOffset = Vector2.subtract( mousePos_world, view.position, {} )
				const distortedDistance = Vector2.getLength( distortedOffset )
				
				if ( distortedDistance < view.radius && view.selected ) {
					view.connectionOpacity = 1
					view.overrideSignalOpacity = true
					// multiple neurons can be active hover targets and that's OK
					view.active = true
				} else if ( distortedDistance < view.radius ) {
					view.connectionOpacity = 1
					view.overrideSignalOpacity = true
					view.active = true
				} else if ( view.selected ) {
					view.connectionOpacity = 1
					view.overrideSignalOpacity = true
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
		if ( this.neuronViews.filter( view => view.active || view.selected ).length === 0 ) {
			for ( const view of this.neuronViews ) {
				view.connectionOpacity = 1
				view.overrideSignalOpacity = false
			}
		}
		
		this.draw( ctx, camera, detail, true )
		
		for ( const hoverTarget of hoverTargets ) {
			Vector2.set( hoverTarget.position, hoverTarget.originalPosition )
			hoverTarget.radius = hoverTarget.originalRadius
			hoverTarget.active = false
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
						this.replicator.ancestorWeights[ j ].weights[ i ],
						neuronViewJ.neuron.weights[ neuronViewI.neuron.index ],
						1 - neuronViewI.neuron.potential,
						ctx.globalAlpha * Math.max( neuronViewI.connectionOpacity, neuronViewJ.connectionOpacity, neuronViewI.selected ? 1 : 0, neuronViewJ.selected ? 1 : 0 ),
						neuronViewI.overrideSignalOpacity || neuronViewJ.overrideSignalOpacity || neuronViewI.selected || neuronViewJ.selected,
						neuronViewJ.neuron.firing )
				}
				
				if ( neuronViewJ.neuron.firing ) {
					// signal from j to i
					this.drawSignal(
						ctx,
						neuronViewJ.position,
						neuronViewJ.radius,
						neuronViewI.position,
						neuronViewI.radius,
						this.replicator.ancestorWeights[ i ].weights[ j ],
						neuronViewI.neuron.weights[ neuronViewJ.neuron.index ],
						1 - neuronViewJ.neuron.potential,
						ctx.globalAlpha * Math.max( neuronViewI.connectionOpacity, neuronViewJ.connectionOpacity, neuronViewI.selected ? 1 : 0, neuronViewJ.selected ? 1 : 0 ),
						neuronViewI.overrideSignalOpacity || neuronViewJ.overrideSignalOpacity || neuronViewI.selected || neuronViewJ.selected,
						neuronViewI.neuron.firing )
				}
			}
		}
		
		// flipper signals
		for ( const flipper of this.replicator.flippers ) {
			if ( flipper.neuron.firing ) {
				const neuronView = this.neuronViews[ flipper.neuron.index ]
				const r1 = this.replicator.radius
				const a1 = flipper.angle
				const flipperPosition = {
					x: this.replicator.position.x + Math.cos( a1 ) * r1,
					y: this.replicator.position.y + Math.sin( a1 ) * r1,
				}
				
				this.drawSignal( ctx, neuronView.position, neuronView.radius, flipperPosition, 3, 1, 1, 1 - flipper.neuron.potential, ctx.globalAlpha * ( neuronView.selected ? 1 : neuronView.connectionOpacity ), neuronView.overrideSignalOpacity  || neuronView.selected)
			}
		}
		
		const inputSourceRadius = 0.26
		
		// receptor signals
		for ( const receptor of this.replicator.receptors ) {
			const receptorPosition = { x: 0, y: 0 }
			receptorPosition.x = this.replicator.position.x + Math.cos( receptor.angle ) * this.replicator.radius * 0.9
			receptorPosition.y = this.replicator.position.y + Math.sin( receptor.angle ) * this.replicator.radius * 0.9
			
			this.drawInputSource( ctx, receptorPosition, inputSourceRadius )
			
			// reds
			{
				const neuron = receptor.neurons.predator
				const neuronView = this.neuronViews[ neuron.index ]
				const ancestorWeight = this.replicator.ancestorWeights[ neuron.index ].weights[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				this.drawSignal( ctx, receptorPosition, inputSourceRadius, neuronView.position, neuronView.radius, ancestorWeight, weight, progress, ctx.globalAlpha * ( neuronView.selected ? 1 : neuronView.connectionOpacity ), neuronView.overrideSignalOpacity || neuronView.selected, neuron.firing )
			}
			
			// greens
			{
				const neuron = receptor.neurons.prey
				const neuronView = this.neuronViews[ neuron.index ]
				const ancestorWeight = this.replicator.ancestorWeights[ neuron.index ].weights[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				this.drawSignal( ctx, receptorPosition, inputSourceRadius, neuronView.position, neuronView.radius, ancestorWeight, weight, progress, ctx.globalAlpha * ( neuronView.selected ? 1 : neuronView.connectionOpacity ), neuronView.overrideSignalOpacity || neuronView.selected, neuron.firing )
			}
			
			// blues
			{
				const neuron = receptor.neurons.blue
				const neuronView = this.neuronViews[ neuron.index ]
				const ancestorWeight = this.replicator.ancestorWeights[ neuron.index ].weights[ neuron.index ]
				const weight = neuron.weights[ neuron.index ]
				const progress = neuron.sensoryPotential / weight % 1
				this.drawSignal( ctx, receptorPosition, inputSourceRadius, neuronView.position, neuronView.radius, ancestorWeight, weight, progress, ctx.globalAlpha * ( neuronView.selected ? 1 : neuronView.connectionOpacity ), neuronView.overrideSignalOpacity || neuronView.selected, neuron.firing )
			}
		}
		
		// hunger neuron signal
		{
			const neuron = this.replicator.hungerNeuron
			const neuronView = this.neuronViews[ neuron.index ]
			const ancestorWeight = this.replicator.ancestorWeights[ neuron.index ].weights[ neuron.index ]
			const weight = neuron.weights[ neuron.index ]
			const progress = neuron.sensoryPotential / weight % 1
			
			const r = this.replicator
			
			const sourcePos = { x: r.position.x, y: 0 } // y set below
			sourcePos.y = r.position.y + r.radius - r.energy * r.radius * 2
			
			this.drawInputSource( ctx, sourcePos, inputSourceRadius )
			
			this.drawSignal( ctx, sourcePos, inputSourceRadius, neuronView.position, neuronView.radius, ancestorWeight, weight, progress, ctx.globalAlpha * ( neuronView.selected ? 1 : neuronView.connectionOpacity ), neuronView.overrideSignalOpacity || neuronView.selected, neuron.firing )
		}
	},
	
	drawInputSource( ctx, center, radius ) {
		ctx.savePartial( 'fillStyle', 'globalCompositeOperation' )
		
		ctx.beginPath()
			ctx.arc( center.x, center.y, radius, 0, Math.PI * 2 )
			ctx.fillStyle = config.excitatoryColor
			ctx.globalCompositeOperation = config.excitatoryCompositeOperation
			ctx.fill()
		
		ctx.restorePartial()
	},
	
	drawSignal( ctx, a_center, a_radius, b_center, b_radius, ancestorWeight, weight, txProgress, baseOpacity, hoverOverride, isIgnored ) {
		const connSep     = 0.040 // how much to separate opposing connections
		const guideWidth  = 0.015
		const signalWidth = 0.140
		
		const signalParts = getSignalParts( ancestorWeight, weight )
		
		const vectorAB = Vector2.subtract( b_center, a_center, {} )
		const edgeDistance = Vector2.getLength( vectorAB ) - ( a_radius + b_radius )
		// angle of vector from a to b
		const angleAB = Vector2.angle( vectorAB )
		// angle of vector from b to a
		const angleBA = angleAB + Math.PI
		
		const connStartPoint = {
			x: a_center.x + Math.cos( angleAB - connSep ) * a_radius,
			y: a_center.y + Math.sin( angleAB - connSep ) * a_radius,
		}
		
		const connEndPoint = {
			x: b_center.x + Math.cos( angleBA + connSep ) * b_radius,
			y: b_center.y + Math.sin( angleBA + connSep ) * b_radius,
		}
		
		const connectionLength = Math.sign( edgeDistance ) * Vector2.distance( connEndPoint, connStartPoint )
		
		const txProgressRescaled = 1 - Math.pow( txProgress, 1/2 )
		
		const x0 = connStartPoint.x
		const y0 = connStartPoint.y
		
		const start = 1 - ( ( 1 - signalParts[ 0 ].start ) * txProgressRescaled )
		const end = 1 - ( ( 1 - signalParts[ 0 ].end ) * txProgressRescaled )
		const x1 = x0 +
			Math.cos( angleAB ) * start * connectionLength
		const y1 = y0 +
			Math.sin( angleAB ) * start * connectionLength
		
		ctx.savePartial( 'lineWidth', 'globalAlpha', 'globalCompositeOperation', 'strokeStyle' )
		
		ctx.globalAlpha = baseOpacity * ( isIgnored ? 0.09 : 1 )
		
		// draw guide
		
		ctx.beginPath()
			ctx.moveTo( x0, y0 )
			ctx.lineTo( x1, y1 )
			ctx.lineWidth = guideWidth
			ctx.strokeStyle = 'rgba(  90, 195, 255, 0.6 )'
			ctx.globalCompositeOperation = config.excitatoryCompositeOperation
			ctx.stroke()
		
		// draw signal from parts
		
		for ( const part of signalParts ) {
			const start = 1 - ( ( 1 - part.start ) * txProgressRescaled )
			const end = 1 - ( ( 1 - part.end ) * txProgressRescaled )
			
			const x1 = x0 +
				Math.cos( angleAB ) * start * connectionLength
			
			const y1 = y0 +
				Math.sin( angleAB ) * start * connectionLength
			
			const x2 = x0 +
				Math.cos( angleAB ) * end * connectionLength
			
			const y2 = y0 +
				Math.sin( angleAB ) * end * connectionLength
			
			ctx.beginPath()
				ctx.moveTo( x1, y1 )
				ctx.lineTo( x2, y2 )
				
				ctx.lineWidth = signalWidth
				
				switch ( part.type ) {
					case SignalPartType.ExcitatoryUnchanged:
						ctx.strokeStyle = config.excitatoryColor
						ctx.globalCompositeOperation = config.excitatoryCompositeOperation
						break
					
					case SignalPartType.ExcitatoryGained:
						ctx.strokeStyle = 'rgba( 218, 240, 255, 1.0 )'
						ctx.globalCompositeOperation = config.excitatoryCompositeOperation
						break
					
					case SignalPartType.InhibitoryUnchanged:
						ctx.strokeStyle = config.inhibitoryColor
						ctx.globalCompositeOperation = config.inhibitoryCompositeOperation
						break
					
					case SignalPartType.InhibitoryGained:
						ctx.strokeStyle = 'rgba( 255, 0, 0, 1.0 )'
						ctx.globalCompositeOperation = config.inhibitoryCompositeOperation
						break
					
					default:
						ctx.strokeStyle = 'magenta'
				}
				
				ctx.stroke()
		}
		
		ctx.restorePartial()
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
		
		const length    =   9.4
		const lengthMid =   7.4
		const baseAngle =   0.36 * Math.PI
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
				ctx.lineTo( length, 0 ) // tip
				
				ctx.closePath()
				
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
		
		const replicator = this.replicator
		const p0 = replicator.position
		const r0 = replicator.radius
		
		if ( this.effects.spawn ) {
			this.effects.spawn.beginDraw( ctx, p0 )
		}
		
		this.drawBackside( ctx )
		
		// this.drawSeparators( ctx )
		
		if ( this.effects.damage ) {
			this.effects.damage.draw( ctx, this.replicator.position, this.replicator.radius )
		}
		
		const beginSignalLod = 2.5
		const endSignalLod   = 5.8
		
		if ( ( this.selected || keepHoverOverride ) && detail >= beginSignalLod ) {
			ctx.savePartial( 'globalAlpha' )
			ctx.globalAlpha *= Math.min( ( detail - beginSignalLod ) / ( endSignalLod - beginSignalLod ), 1.0 )
			
			this.drawSignals( ctx )
			
			ctx.restorePartial()
		}
		
		// draw neurons
		for ( const neuronView of this.neuronViews ) {
			neuronView.draw( ctx, detail )
		}
		
		// draw energy
		{
			let oldGlobalAlpha
			
			const beginEnergyLod = 1.0
			const endEnergyLod   = 7.1
			const minAlpha       = 0.22
			const maxAlpha       = 1.0
			
			const progress = 1 - ( detail - beginEnergyLod ) / ( endEnergyLod - beginEnergyLod ) // 1..0
			const alpha = minAlpha + ( progress * ( maxAlpha - minAlpha ) )
			
			if ( detail >= beginEnergyLod ) {
				oldGlobalAlpha = ctx.globalAlpha
				ctx.globalAlpha *= Math.max( alpha, minAlpha )
			}
			
			this.drawEnergy( ctx )
			
			// draw glossy face
			ctx.drawImage( this.assets.face, p0.x - r0, p0.y - r0, r0 * 2, r0 * 2 )
			
			if ( detail >= beginEnergyLod ) {
				ctx.globalAlpha = oldGlobalAlpha
			}
		}
		
		this.drawFlippers( ctx )
		
		this.drawEdge( ctx )
		
		if ( this.effects.death ) {
			ctx.beginPath()
				ctx.arc( this.replicator.position.x, this.replicator.position.y, this.replicator.radius - 2.9/2, 0, Math.PI * 2 )
				ctx.fillStyle = 'orange'
				ctx.fill()
		}
		
		if ( this.effects.spawn ) {
			this.effects.spawn.endDraw( ctx )
		}
		
		ctx.restorePartial()
	},
}
