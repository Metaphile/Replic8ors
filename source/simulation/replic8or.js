// TODO dead property

import Flipper from './flipper'
import Network from './neural-network'
import Neuron  from './neuron'
import Events  from '../engine/events'
import Physics from '../engine/physics'
import Math2   from '../engine/math-2'
import Vector2 from '../engine/vector-2'

const defaultOpts = {
	radius: 32,
	mass: 10,
	drag: 60,
	elasticity: 1,
	
	energy: 0.5,
	metabolism: 1 / ( 2 * 60 ),
	
	numBodySegments: 2,
	receptorOffset: -1/8 * ( Math.PI * 2 ),
	flipperOffset: -5/8 * ( Math.PI * 2 ),
	
	takingDamage: false,
	flipperStrength: 4500,
}

function createSymmetricSegments() {
	this.flippers  = []
	this.receptors = []
	
	for ( let i = 0; i < this.numBodySegments; i++ ) {
		// flipper
		{
			const angle = this.flipperOffset + i * ( Math.PI / 2 )
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
				
				if ( this.flippers.indexOf( flipper ) === 0 ) {
					this.applyTorque( -torque, dt )
				} else {
					this.applyTorque( torque, dt )
				}
			} )
			
			this.flippers.push( flipper )
		}
		
		// receptor
		{
			const angle = this.receptorOffset + i * ( Math.PI / 2 )
			const receptor = { angle }
			receptor.fov = Math.PI / 2
			
			const foodNeuron = Neuron()
			this.brain.addNeuron( foodNeuron )
			
			const predatorNeuron = Neuron()
			this.brain.addNeuron( predatorNeuron )
			
			const replicatorNeuron = Neuron()
			this.brain.addNeuron( replicatorNeuron )
			
			receptor.neurons = [ foodNeuron, predatorNeuron, replicatorNeuron ]
			// receptor.neurons = [ foodNeuron ]
			receptor.neurons.food = foodNeuron
			receptor.neurons.replicator = replicatorNeuron
			receptor.neurons.predator = predatorNeuron
			
			this.receptors.push( receptor )
		}
	}
	
	this.hungerNeuron = Neuron()
	this.brain.addNeuron( this.hungerNeuron )
	
	this.thinkNeurons = []
	for ( let n = 2; n > 0; n-- ) {
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
		neuron.weights = neuron.weights.map( weight => Math2.randRange( -0.5, 0.5 ) )
	}
	
	const neuronsPerSegment = 4
	Replic8or.syncSymmetricWeights( replicator.brain.neurons, replicator.numBodySegments, neuronsPerSegment )
}

export default function Replic8or( opts = {} ) {
	const self = Object.create( Replic8or.prototype )
	Events( self )
	Physics( self )
	
	Object.assign( self, defaultOpts, opts )
	self.brain = Network()
	createSymmetricSegments.call( self )
	
	programBasicInstincts( self )
	// programNonsense( self )
	
	// make all sensory input excitatory to begin with
	for ( const neuron of self.brain.neurons ) {
		neuron.weights[ neuron.index ] = 0.1
	}
	
	return self
}

Replic8or.prototype = {
	update: function ( dt ) {
		// stimulate hunger neuron _before_ updating brain
		// may fix rare issue where neuron has potential == 1 on activation frame
		// instead of 1 - delta
		this.hungerNeuron.stimulate( Math.pow( 1 - this.energy, 2 ) * 30 * dt )
		
		this.brain.update( dt )
		
		for ( const flipper of this.flippers ) flipper.update( dt )
		
		this.updatePhysics( dt )
		
		if ( this.energy >= 1 ) {
			this.energy = 1
			this.replicate()
		}
		
		this.energy -= this.metabolism * dt
		
		if ( this.energy <= 0 ) this.die()
	},
	
	senseFood: function ( food, dt ) {
		for ( const receptor of this.receptors ) {
			// angle from replicator center to food center
			// so not exactly correct but maybe good enough
			const angleToFood = Vector2.angle( Vector2.from( this.position, food.position ) )
			
			if ( !( angleToFood >= ( this.rotation + receptor.angle ) - ( receptor.fov / 2 ) && angleToFood <= ( this.rotation + receptor.angle ) + ( receptor.fov / 2 ) ) ) {
				continue;
			}
			
			const receptorPosition = Object.assign( {}, this.position )
			receptorPosition.x += Math.cos( this.rotation + receptor.angle ) * this.radius
			receptorPosition.y += Math.sin( this.rotation + receptor.angle ) * this.radius
			
			const distance = Vector2.distance( food.position, receptorPosition ) - food.radius
			const strength = 1000000 * ( distance <= 0 ? 1 :
				1 / ( 1 + Math.pow( distance, 2 ) ) )
			
			receptor.neurons.food.stimulate( strength * dt )
		}
	},
	
	senseReplicator: function ( replicator, dt ) {
		for ( const receptor of this.receptors ) {
			const angleToReplicator = Vector2.angle( Vector2.from( this.position, replicator.position ) )
			
			if ( !( angleToReplicator >= ( this.rotation + receptor.angle ) - ( receptor.fov / 2 ) && angleToReplicator <= ( this.rotation + receptor.angle ) + ( receptor.fov / 2 ) ) ) {
				continue;
			}
			
			const receptorPosition = Object.assign( {}, this.position )
			receptorPosition.x += Math.cos( this.rotation + receptor.angle ) * this.radius
			receptorPosition.y += Math.sin( this.rotation + receptor.angle ) * this.radius
			
			const distance = Vector2.distance( replicator.position, receptorPosition ) - replicator.radius
			const strength = 1000000 * ( distance <= 0 ? 1 :
				1 / ( 1 + Math.pow( distance, 2 ) ) )
			
			receptor.neurons.replicator.stimulate( strength * dt )
		}
	},
	
	sensePredator: function ( predator, dt ) {
		for ( const receptor of this.receptors ) {
			const angleToPredator = Vector2.angle( Vector2.from( this.position, predator.position ) )
			
			if ( !( angleToPredator >= ( this.rotation + receptor.angle ) - ( receptor.fov / 2 ) && angleToPredator <= ( this.rotation + receptor.angle ) + ( receptor.fov / 2 ) ) ) {
				continue;
			}
			
			const receptorPosition = Object.assign( {}, this.position )
			receptorPosition.x += Math.cos( this.rotation + receptor.angle ) * this.radius
			receptorPosition.y += Math.sin( this.rotation + receptor.angle ) * this.radius
			
			const distance = Vector2.distance( predator.position, receptorPosition ) - predator.radius
			const strength = 1000000 * ( distance <= 0 ? 1 :
				1 / ( 1 + Math.pow( distance, 2 ) ) )
			
			receptor.neurons.predator.stimulate( strength * dt )
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
					return weight + 0.4 * Math.pow( Math2.randRange( -1, 1 ), 3 )
				} else {
					return weight
				}
			} )
		}
	},
	
	fixSensoryWeights: function ( neurons ) {
		for ( let i = 0; i < neurons.length; i++ ) {
			neurons[ i ].weights[ i ] = 0.3
		}
	},
	
	normalizeWeights: function ( neurons ) {
		let maxWeightAbs = 1
		
		for ( let i = 0; i < neurons.length; i++ ) {
			const neuron = neurons[ i ]
			
			for ( let j = 0; j < neuron.weights.length; j++ ) {
				const weight = neuron.weights[ j ]
				const weightAbs = Math.abs( weight )
				
				// don't include sensory weights when calculating max
				if ( weightAbs > maxWeightAbs && i !== j ) {
					maxWeightAbs = Math.abs( weight )
				}
			}
		}
		
		for ( const neuron of neurons ) {
			neuron.weights = neuron.weights.map( weight => weight * 1/maxWeightAbs )
		}
	},
	
	// TODO quietly -> emitEvent
	replicate: function ( quietly, mutationRate = 0.01 ) {
		const parent = this
		const child = Replic8or( {
			radius: this.radius,
			mass: this.mass,
			drag: this.drag,
			rotation: Math.random() * Math.PI * 2,
			elasticity: this.elasticity,
			numBodySegments: this.numBodySegments,
			
			energy: this.energy,
			metabolism: this.metabolism,
			flipperStrength: this.flipperStrength,
		} )
		
		this.copyWeights( parent.brain.neurons, child.brain.neurons )
		this.mutateWeights( child.brain.neurons, mutationRate )
		this.normalizeWeights( child.brain.neurons )
		this.fixSensoryWeights( child.brain.neurons )
		
		for ( let i = 0; i < parent.brain.neurons.length; i++ ) {
			child.brain.neurons[ i ].potentialDecayRate = parent.brain.neurons[ i ].potentialDecayRate
		}
		
		// TODO u wot m8?
		const neuronsPerSegment = 4
		// Replic8or.syncSymmetricWeights( child.brain.neurons, parent.numBodySegments, neuronsPerSegment )
		
		// TODO maybe divide parent's actual energy in half?
		parent.energy = child.energy = 0.5
		
		Vector2.set( child.position, parent.position )
		// Vector2.set( child.velocity, parent.velocity )
		
		// TEMP just looks cool
		// child.flippers.forEach( flipper => flipper.flip() )
		
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
