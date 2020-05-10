import config from '../config'
import * as preyAssets from './prey-assets'
import * as predatorAssets from './predator-assets'
import * as blueAssets from './blue-assets'
import NeuronView from './neuron-view'
import Vector2 from '../engine/vector-2'
import { areCloserThan } from '../simulation/world-helpers'

const pseudoNeuronRadius = 0.3

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

const dimmedSignalOpacityPct = 0.09

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
		
		this._apparentEnergy += ( this.replicator.energy - this._apparentEnergy ) * 9 * Math.min( dt_sim, dt_real )
		this._slosh = ( this._slosh + ( 0.51 * Math.min( dt_sim, dt_real ) ) ) % ( Math.PI * 2 )
		
		if ( this.effects.spawn ) this.effects.spawn.update( Math.min( dt_sim, dt_real ) )
		for ( const effect of this.effects.energyUps ) effect.update( Math.min( dt_sim, dt_real ) )
		if ( this.effects.damage ) this.effects.damage.update( Math.min( dt_sim, dt_real ) )
		if ( this.effects.death ) this.effects.death.update( Math.min( dt_sim, dt_real ) )
		
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
	
	drawPseudoNeurons( ctx, detail ) {
		const beginSignalLod = 2.5
		const endSignalLod   = 5.8
		
		if ( detail < beginSignalLod ) {
			return
		}
		
		ctx.savePartial( 'fillStyle', 'globalAlpha', 'globalCompositeOperation' )
		ctx.globalAlpha *= Math.min( ( detail - beginSignalLod ) / ( endSignalLod - beginSignalLod ), 1.0 )
		
		const { x: x0, y: y0 } = this.replicator.position
		const r0 = this.replicator.radius
		
		// to be reused for each pseudo neuron
		const pseudoNeuron = {
			position: { x: 0, y: 0 },
			radius: pseudoNeuronRadius,
		}
		
		// receptors
		for ( const receptor of this.replicator.receptors ) {
			pseudoNeuron.position.x = x0 + Math.cos( receptor.angle ) * r0 * 0.9
			pseudoNeuron.position.y = y0 + Math.sin( receptor.angle ) * r0 * 0.9
			this.drawPseudoNeuron( ctx, pseudoNeuron.position, pseudoNeuron.radius )
		}
		
		// hunger / energy
		pseudoNeuron.position.x = x0,
		pseudoNeuron.position.y = y0 + r0 - ( this.replicator.energy * r0 * 2 )
		this.drawPseudoNeuron( ctx, pseudoNeuron.position, pseudoNeuron.radius )
		
		// flippers
		for ( const flipper of this.replicator.flippers ) {
			pseudoNeuron.position.x = x0 + Math.cos( flipper.angle ) * r0 * 0.9
			pseudoNeuron.position.y = y0 + Math.sin( flipper.angle ) * r0 * 0.9
			this.drawPseudoNeuron( ctx, pseudoNeuron.position, pseudoNeuron.radius )
		}
		
		ctx.restorePartial()
	},
	
	drawPseudoNeuron( ctx, center, radius ) {
		ctx.beginPath()
			ctx.arc( center.x, center.y, radius, 0, Math.PI * 2 )
			ctx.fillStyle = config.excitatoryColor
			ctx.globalCompositeOperation = config.excitatoryCompositeOperation
			ctx.fill()
	},
	
	drawSignals( ctx, detail ) {
		const beginSignalLod = 2.5
		const endSignalLod   = 5.8
		
		if ( detail < beginSignalLod ) {
			return
		}
		
		ctx.savePartial( 'lineWidth', 'globalAlpha', 'globalCompositeOperation', 'strokeStyle' )
		ctx.globalAlpha *= Math.min( ( detail - beginSignalLod ) / ( endSignalLod - beginSignalLod ), 1.0 )
		
		const drawAllSignals = !this.neuronViews.some( v => v.active || v.selected )
		
		this.drawInputSignals( ctx, drawAllSignals )
		this.drawInternalSignals( ctx, drawAllSignals )
		this.drawOutputSignals( ctx, drawAllSignals )
		
		ctx.restorePartial()
	},
	
	drawInputSignals( ctx, drawAllSignals ) {
		const { x: x0, y: y0 } = this.replicator.position
		const r0 = this.replicator.radius
		
		// to be reused for each input node
		const inputNode = {
			position: { x: 0, y: 0 },
			radius: pseudoNeuronRadius,
		}
		
		// receptor signals
		for ( const receptor of this.replicator.receptors ) {
			inputNode.position.x = x0 + Math.cos( receptor.angle ) * r0 * 0.9
			inputNode.position.y = y0 + Math.sin( receptor.angle ) * r0 * 0.9
			
			for ( const neuron of receptor.neurons ) {
				const neuronView = this.neuronViews[ neuron.index ]
				const drawThisSignal = neuronView.active || neuronView.selected
				
				if ( drawAllSignals || drawThisSignal ) {
					this.drawInputSignal( ctx, inputNode, neuronView )
				}
			}
		}
		
		// hunger signal
		{
			inputNode.position.x = x0,
			inputNode.position.y = y0 + r0 - ( this.replicator.energy * r0 * 2 )
			
			const neuronView = this.neuronViews[ this.replicator.hungerNeuron.index ]
			const drawThisSignal = neuronView.active || neuronView.selected
			
			if ( drawAllSignals || drawThisSignal ) {
				this.drawInputSignal( ctx, inputNode, neuronView )
			}
		}
	},
	
	drawInputSignal( ctx, inputNode, neuronView ) {
		const origWeight = this.replicator.ancestorWeights[ neuronView.neuron.index ].weights[ neuronView.neuron.index ]
		const currWeight = neuronView.neuron.weights[ neuronView.neuron.index ]
		const signalParts = getSignalParts( origWeight, currWeight )
		const txProgress = neuronView.neuron.sensoryPotential / currWeight % 1
		
		const dimIgnoredSignal = neuronView.neuron.firing && !neuronView.active
		
		if ( dimIgnoredSignal ) {
			ctx.savePartial( 'globalAlpha' )
			ctx.globalAlpha *= dimmedSignalOpacityPct
		}
		
		this.drawSignal( ctx, inputNode, neuronView, signalParts, txProgress, false )
		
		if ( dimIgnoredSignal ) {
			ctx.restorePartial()
		}
	},
	
	// signals between neurons
	drawInternalSignals( ctx, drawAllSignals ) {
		const numViews = this.neuronViews.length
		
		for ( let i = 0; i < numViews; i++ ) {
			const leftView = this.neuronViews[ i ]
			const leftViewIsHighlighted = leftView.active || leftView.selected
			
			for ( let j = i + 1; j < numViews; j++ ) {
				const rightView = this.neuronViews[ j ]
				const rightViewIsHighlighted = rightView.active || rightView.selected
				const drawTheseSignals = leftViewIsHighlighted || rightViewIsHighlighted
				
				if ( drawAllSignals || drawTheseSignals ) {
					if ( leftView.neuron.firing ) {
						const dimIgnoredSignal = rightView.neuron.firing && !leftView.active && !rightView.active
						
						if ( dimIgnoredSignal ) {
							ctx.savePartial( 'globalAlpha' )
							ctx.globalAlpha *= dimmedSignalOpacityPct
						}
						
						this.drawInternalSignal( ctx, leftView, rightView )
						
						if ( dimIgnoredSignal ) {
							ctx.restorePartial()
						}
					}
					
					if ( rightView.neuron.firing ) {
						const dimIgnoredSignal = leftView.neuron.firing && !leftView.active && !rightView.active
						
						if ( dimIgnoredSignal ) {
							ctx.savePartial( 'globalAlpha' )
							ctx.globalAlpha *= dimmedSignalOpacityPct
						}
						
						this.drawInternalSignal( ctx, rightView, leftView )
						
						if ( dimIgnoredSignal ) {
							ctx.restorePartial()
						}
					}
				}
			}
		}
	},
	
	drawInternalSignal( ctx, sourceView, targetView ) {
		const origWeight = this.replicator.ancestorWeights[ targetView.neuron.index ].weights[ sourceView.neuron.index ]
		const currWeight = targetView.neuron.weights[ sourceView.neuron.index ]
		const signalParts = getSignalParts( origWeight, currWeight )
		const txProgress = 1 - sourceView.neuron.potential
		
		this.drawSignal( ctx, sourceView, targetView, signalParts, txProgress )
	},
	
	drawOutputSignals( ctx, drawAllSignals ) {
		const { x: x0, y: y0 } = this.replicator.position
		const r0 = this.replicator.radius
		
		// to be reused for each output node
		const outputNode = {
			position: { x: 0, y: 0 },
			radius: pseudoNeuronRadius,
		}
		
		const signalParts = getSignalParts( 1, 1 )
		
		// flipper signals
		for ( const flipper of this.replicator.flippers ) {
			outputNode.position.x = x0 + Math.cos( flipper.angle ) * r0 * 0.9
			outputNode.position.y = y0 + Math.sin( flipper.angle ) * r0 * 0.9
			
			if ( flipper.neuron.firing ) {
				const neuronView = this.neuronViews[ flipper.neuron.index ]
				const drawThisSignal = neuronView.active || neuronView.selected
				
				if ( drawAllSignals || drawThisSignal ) {
					const txProgress = 1 - flipper.neuron.potential
					this.drawSignal( ctx, neuronView, outputNode, signalParts, txProgress, false )
				}
			}
		}
	},
	
	drawSignal( ctx, sourceNode, targetNode, signalParts, txProgress, offsetEndpoints = true ) {
		const connSep = offsetEndpoints ? 0.04 : 0
		const guideWidth  = 0.015
		const signalWidth = 0.140
		
		// cache properties
		const { x: sourceX, y: sourceY } = sourceNode.position
		const { x: targetX, y: targetY } = targetNode.position
		const sourceRadius = sourceNode.radius
		const targetRadius = targetNode.radius
		
		const angleToTarget = Math.atan2( targetY - sourceY, targetX - sourceX )
		const angleToSource = angleToTarget + Math.PI
		
		const connStartX = sourceX + Math.cos( angleToTarget - connSep ) * sourceRadius
		const connStartY = sourceY + Math.sin( angleToTarget - connSep ) * sourceRadius
		const connEndX   = targetX + Math.cos( angleToSource + connSep ) * targetRadius
		const connEndY   = targetY + Math.sin( angleToSource + connSep ) * targetRadius
		const connDeltaX = connEndX - connStartX
		const connDeltaY = connEndY - connStartY
		const connDir = areCloserThan( sourceNode, targetNode, 0 ) ? -1 : 1
		const connLength = connDir * Math.sqrt( ( connDeltaX * connDeltaX ) + ( connDeltaY * connDeltaY ) )
		
		const txProgress2 = Math.pow( txProgress, 1/2 )
		
		// draw guideline from connection start to signal start
		
		const signalStartX = connStartX + Math.cos( angleToTarget ) * connLength * txProgress2
		const signalStartY = connStartY + Math.sin( angleToTarget ) * connLength * txProgress2
		
		ctx.beginPath()
			ctx.moveTo( connStartX, connStartY )
			ctx.lineTo( signalStartX, signalStartY )
			ctx.lineWidth = guideWidth
			ctx.strokeStyle = 'rgba(  90, 195, 255, 0.6 )'
			ctx.globalCompositeOperation = 'screen'
			ctx.stroke()
		
		// draw signal parts (inhibitory, delta, excitatory)
		
		for ( const part of signalParts ) {
			const partStartLength = ( connLength * txProgress2 ) + ( part.start * connLength * ( 1 - txProgress2 ) )
			const partEndLength   = ( connLength * txProgress2 ) + ( part.end   * connLength * ( 1 - txProgress2 ) )
			
			const partStartX = connStartX + Math.cos( angleToTarget ) * partStartLength
			const partStartY = connStartY + Math.sin( angleToTarget ) * partStartLength
			const partEndX   = connStartX + Math.cos( angleToTarget ) * partEndLength
			const partEndY   = connStartY + Math.sin( angleToTarget ) * partEndLength
			
			ctx.beginPath()
				ctx.moveTo( partStartX, partStartY )
				ctx.lineTo( partEndX, partEndY )
				
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
						break
				}
				
				ctx.stroke()
		}
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
		
		if ( this.effects.damage ) {
			this.effects.damage.draw( ctx, this.replicator.position, this.replicator.radius )
		}
		
		this.drawPseudoNeurons( ctx, detail )
		
		if ( this.selected || keepHoverOverride ) {
			this.drawSignals( ctx, detail )
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
