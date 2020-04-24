import Flipper from './flipper'
import Network from './neural-network'
import Neuron  from './neuron'
import Events  from '../engine/events'
import Physics from '../engine/physics'
import Math2   from '../engine/math-2'
import Vector2 from '../engine/vector-2'
// import { formatWeight } from '../helpers'
import { replicatorSettings } from '../settings/settings'
import Predator from './predator'
import Prey from './prey'

function createSymmetricSegments() {
	this.flippers  = []
	this.receptors = []
	
	for ( let i = 0; i < this.numBodySegments; i++ ) {
		// flipper
		{
			const angle = this.flipperOffset + ( i / this.numBodySegments * Math.PI * 2 )
			const flipper = Flipper( angle, { strength: this.flipperStrength } )
			
			const motorNeuron = Neuron()
			motorNeuron.on( 'fire', () => flipper.flip() )
			this.brain.addNeuron( motorNeuron )
			// TODO the neuron property isn't part of Flipper's interface and
			// flippers don't need to know about neurons
			// but it's convenient to store a reference on flipper
			flipper.neuron = motorNeuron
			
			flipper.on( 'flipping', ( force, dt, torque ) => {
				this.applyForce( Vector2.rotate( force, this.rotation ), dt )
				
				// if ( this.flippers.indexOf( flipper ) === 0 ) {
				// 	this.applyTorque( -torque, dt )
				// } else {
				// 	this.applyTorque( torque, dt )
				// }
			} )
			
			this.flippers.push( flipper )
		}
		
		// receptor
		{
			const angle = this.receptorOffset + ( i / this.numBodySegments * Math.PI * 2 )
			const receptor = { angle }
			
			const foodNeuron = Neuron()
			this.brain.addNeuron( foodNeuron )
			
			const predatorNeuron = Neuron()
			this.brain.addNeuron( predatorNeuron )
			
			const preyNeuron = Neuron()
			this.brain.addNeuron( preyNeuron )
			
			receptor.neurons = [ foodNeuron, predatorNeuron, preyNeuron ]
			receptor.neurons.food = foodNeuron
			receptor.neurons.prey = preyNeuron
			receptor.neurons.predator = predatorNeuron
			
			this.receptors.push( receptor )
		}
	}
	
	this.hungerNeuron = Neuron()
	this.brain.addNeuron( this.hungerNeuron )
	
	this.thinkNeurons = []
	for ( let n = this.numInternalNeurons; n > 0; n-- ) {
		const thinkNeuron = Neuron()
		this.brain.addNeuron( thinkNeuron )
		this.thinkNeurons.push( thinkNeuron )
	}
}

function programBasicInstincts( replicator ) {
	const { numBodySegments: numSegments, receptors, flippers } = replicator
	
	// make all sensory input excitatory
	for ( const neuron of replicator.brain.neurons ) {
		neuron.weights = neuron.weights.map( ( weight, weightIndex ) => {
			return weightIndex === neuron.index ? 0.9 : weight
		} )
	}
	
	for ( let segmentIndex = 0; segmentIndex < numSegments; segmentIndex++ ) {
		// start at current segment, add half rotation, wrap overflow
		const oppositeSegmentIndex = ( segmentIndex + Math.floor( numSegments / 2 ) ) % numSegments
		
		const foodNeuron = receptors[ segmentIndex ].neurons.food
		const oppositeFlipper = flippers[ segmentIndex ]
		
		oppositeFlipper.neuron.weights[ foodNeuron.index ] = 0.9
		
		const otherFoodNeurons = receptors
			.filter( ( receptor, i ) => i !== segmentIndex ) // other receptors
			.map( receptor => receptor.neurons.food ) // other food neurons
		
		otherFoodNeurons.forEach( otherFoodNeuron => otherFoodNeuron.weights[ foodNeuron.index ] = -0.9 )
	}
}

function programNonsense( replicator ) {
	for ( const neuron of replicator.brain.neurons ) {
		neuron.weights = neuron.weights.map( weight => Math2.randRange( -1.0, 1.0 ) )
	}
	
	const neuronsPerSegment = 4
	Replic8or.syncSymmetricWeights( replicator.brain.neurons, replicator.numBodySegments, neuronsPerSegment )
}

function programExcitatorySenses( replicator ) {
	for ( const neuron of replicator.brain.neurons ) {
		neuron.weights[ neuron.index ] = 0.2
	}
}

export default function Replic8or( opts = {} ) {
	const self = Object.create( Replic8or.prototype )
	Events( self )
	Physics( self )
	
	Object.assign( self, replicatorSettings, opts )
	self.brain = Network()
	createSymmetricSegments.call( self )
	
	// programBasicInstincts( self )
	programNonsense( self )
	// programExcitatorySenses( self )
	self.makeSensoryWeightsExcitatory( self.brain.neurons )
	
	// add metabolic cost to neuron activation
	self.brain.neurons.forEach( neuron => {
		neuron.on( 'fire', () => {
			self.energy -= self.energyCostPerNeuronSpike
		} )
	} )
	
	self.ancestorWeights = opts.ancestorWeights || self.getOwnWeights()
	
	return self
}

Replic8or.prototype = {
	type: 'replicator',
	takingDamage: false,
	
	getOwnWeights: function () {
		const pseudoNeurons = []
		
		this.brain.neurons.forEach( () => {
			pseudoNeurons.push( { weights: [] } )
		} )
		
		this.copyWeights( this.brain.neurons, pseudoNeurons )
		
		return pseudoNeurons
	},
	
	update: function ( dt ) {
		// stimulate hunger neuron _before_ updating brain
		// may fix rare issue where neuron has potential == 1 on activation frame
		// instead of 1 - delta
		this.hungerNeuron.stimulate( Math.pow( 1 - Math2.clamp( this.energy, 0, 1 ), 2 ) * 30 * dt )
		
		this.brain.update( dt )
		
		for ( const flipper of this.flippers ) flipper.update( dt )
		
		this.updatePhysics( dt )
		
		if ( this.energy >= 1 ) {
			this.replicate()
		}
		
		this.energy -= this.metabolism * dt
		
		if ( this.energy <= 0 ) this.die()
	},
	
	sense: function ( stimulus, dt ) {
		// cache properties for performance
		const stimulusPosX   = stimulus.position.x
		const stimulusPosY   = stimulus.position.y
		const stimulusRadius = stimulus.radius
		const stimulusType   = stimulus.type
		const receptors      = this.receptors
		const repPosX        = this.position.x
		const repPosY        = this.position.y
		const repRadius      = this.radius
		const repRotation    = this.rotation
		const numReceptors   = receptors.length
		
		for ( let i = 0; i < numReceptors; i++ ) {
			const receptor = receptors[ i ]
			const receptorNeuron = receptor.neurons[ stimulusType ]
			
			if ( !receptorNeuron ) {
				throw `can't sense unknown stimulus type ${ stimulusType }`
			}
			
			const receptPosX = repPosX + Math.cos( repRotation + receptor.angle ) * repRadius
			const receptPosY = repPosY + Math.sin( repRotation + receptor.angle ) * repRadius
			
			// distance from pointlike receptor to nearest edge of stimulus
			const dx = stimulusPosX - receptPosX
			const dy = stimulusPosY - receptPosY
			const distance = Math.sqrt( dx*dx + dy*dy ) - stimulusRadius
			
			const curveWidth = 5
			const curveHeight = 700
			// similar to the inverse square function except there's no asymptote at x = 0
			const input = curveHeight * ( 1 / ( 1 + Math.pow( distance / curveWidth, 2 ) ) ) * dt
			
			receptorNeuron.stimulate( input )
		}
	},
	
	die: function () {
		this.dead = true
		this.emit( 'died', this )
		
		// release event handlers
		this.flippers.forEach( flipper => flipper.off() )
		this.brain.neurons.forEach( neuron => neuron.off() )
		this.off()
	},
	
	copyWeights: function ( sourceNeurons, targetNeurons ) {
		for ( let i = 0; i < sourceNeurons.length; i++ ) {
			for ( let j = 0; j < sourceNeurons[ i ].weights.length; j++ ) {
				targetNeurons[ i ].weights[ j ] = sourceNeurons[ i ].weights[ j ]
			}
		}
	},
	
	mutateWeights: function ( neurons, mutationRate ) {
		for ( const neuron of neurons ) {
			neuron.weights = neuron.weights.map( weight => {
				if ( mutationRate > Math.random() ) {
					// -1..1, biased toward 0
					const mutation = Math.pow( Math2.randRange( -1, 1 ), 3 )
					const mutatedWeight = Math.sin( Math.asin( weight ) + Math.asin( mutation ) )
					// console.log( `${ formatWeight( weight ) } => ${ formatWeight( mutatedWeight ) } (${ formatWeight( mutatedWeight - weight ) })` )
					return mutatedWeight
				} else {
					return weight
				}
			} )
		}
	},
	
	makeSensoryWeightsExcitatory: function ( neurons ) {
		for ( const neuron of neurons ) {
			neuron.weights = neuron.weights.map( ( weight, weightIndex ) => {
				if ( weightIndex === neuron.index ) {
					return Math.abs( weight )
				} else {
					return weight
				}
			} )
		}
	},
	
	// TODO quietly -> emitEvent
	replicate: function ( quietly, mutationRate = 0.04 ) {
		const parent = this
		const child = ( () => {
			const childOpts = {}
			Object.keys( replicatorSettings ).forEach( key => childOpts[ key ] = parent[ key ] )
			childOpts.ancestorWeights = parent.ancestorWeights
			
			switch ( parent.type ) {
				case 'replicator':
					return Replic8or( childOpts )
				
				case 'predator':
					return Predator( childOpts )
				
				case 'prey':
					return Prey( childOpts )
				
				default:
					throw `can't replicate unknown replicator type ${ parent.type }`
			}
		} )()
		
		this.copyWeights( parent.brain.neurons, child.brain.neurons )
		this.mutateWeights( child.brain.neurons, mutationRate )
		this.makeSensoryWeightsExcitatory( child.brain.neurons )
		
		for ( let i = 0; i < parent.brain.neurons.length; i++ ) {
			child.brain.neurons[ i ].potentialDecayRate = parent.brain.neurons[ i ].potentialDecayRate
		}
		
		// TODO u wot m8?
		const neuronsPerSegment = 4
		Replic8or.syncSymmetricWeights( child.brain.neurons, parent.numBodySegments, neuronsPerSegment )
		
		// divide parent energy between parent and child (parent energy might be > 1)
		parent.energy = child.energy = ( parent.energy / 2 )
		
		Vector2.set( child.position, parent.position )
		Vector2.set( child.velocity, parent.velocity )
		
		// activate all flippers simultaneously when a replicator is born
		// because it looks cool
		child.flippers.forEach( flipper => flipper.flip() )
		
		// HACK replicated event causes test 'adds more replicators' to fail
		// last replicator dying triggers reset before replicator's
		// event handlers have been released
		if ( !quietly ) this.emit( 'replicated', parent, child )
		
		return child
	},
}

// copy weights from 0th segment to each subsequent segment to enforce symmetry.
// mutations outside the 0th segment will be overwritten.
Replic8or.syncSymmetricWeights = ( neurons, numSegments, numNeuronsPerSegment ) => {
	const numSymmetricNeurons = numSegments * numNeuronsPerSegment
	
	// start with second segment (index 1)
	for ( let currSegmentIndex = 1; currSegmentIndex < numSegments; currSegmentIndex++ ) {
		const firstNeuronIndexCurrSegment = currSegmentIndex * numNeuronsPerSegment
		const lastNeuronIndexThisSegment = firstNeuronIndexCurrSegment + numNeuronsPerSegment - 1
		
		for ( let currNeuronIndex = firstNeuronIndexCurrSegment; currNeuronIndex <= lastNeuronIndexThisSegment; currNeuronIndex++ ) {
			const targetNeuron = neurons[ currNeuronIndex ]
			// find equivalent neuron in first segment
			const sourceNeuronIndex = currNeuronIndex - firstNeuronIndexCurrSegment
			const sourceNeuron = neurons[ sourceNeuronIndex ]
			
			targetNeuron.potentialDecayRate = sourceNeuron.potentialDecayRate
			
			targetNeuron.weights = sourceNeuron.weights.map( ( weight, weightIndex ) => {
				if ( weightIndex < numSymmetricNeurons ) {
					let sourceWeightIndex
					
					sourceWeightIndex  = weightIndex
					sourceWeightIndex -= currSegmentIndex * numNeuronsPerSegment
					// source indexes for low-index weights will be negative
					// wrap negative indexes
					sourceWeightIndex += numSymmetricNeurons
					sourceWeightIndex %= numSymmetricNeurons
					
					return sourceNeuron.weights[ sourceWeightIndex ]
				} else {
					return weight
				}
			} )
		}
	}
	
	// inbound connections for free neurons
	// TODO this almost certainly doesn't work with more than one free neuron
	for ( let i = numSymmetricNeurons; i < neurons.length; i++ ) {
		const neuron = neurons[i]
		neuron.weights = neuron.weights.map( ( weight, weightIndex, weights ) => {
			if ( weightIndex < numSymmetricNeurons ) {
				// equivalent weight from first segment
				return weights[ weightIndex % numNeuronsPerSegment ]
			} else {
				return weight
			}
		} )
	}
}
