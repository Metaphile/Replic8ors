// TODO dead property

import Flipper from './flipper'
import Network from './neural-network'
import Neuron  from './neuron'
import Events  from '../engine/events'
import Physics from '../engine/physics'
import Math2   from '../engine/math-2'
import Vector2 from '../engine/vector-2'

// can't refer to other members with object literal syntax
const defaultOpts = new function () {
	this.radius = 32
	this.mass = 26
	this.drag = 55
	this.elasticity = 1
	
	this.energy = 0.5
	this.metabolism = 1 / ( 1.75 * 60 )
	
	this.numBodySegments = 3
	this.receptorOffset = -Math.PI / 2, // up
	this.flipperOffset = this.receptorOffset + ( Math.PI / this.numBodySegments )
	
	this.takingDamage = false
}

function createSymmetricSegments() {
	this.flippers  = []
	this.receptors = []
	
	for ( let i = 0; i < this.numBodySegments; i++ ) {
		// flipper
		{
			const angle = this.flipperOffset + ( i / this.numBodySegments * Math.PI * 2 )
			const flipper = Flipper( angle )
			
			const motorNeuron = Neuron()
			motorNeuron.on( 'fire', () => flipper.flip() )
			this.brain.addNeuron( motorNeuron )
			// TODO the neuron property isn't part of Flipper's interface and
			// flippers don't need to know about neurons
			// but it's convenient to store a reference on flipper
			flipper.neuron = motorNeuron
			
			flipper.on( 'flipping', ( force, dt, torque ) => {
				this.applyForce( Vector2.rotate( force, this.rotation ), dt )
				this.applyTorque( torque, dt )
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
	for ( let n = 3; n > 0; n-- ) {
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
			return weightIndex === neuron.index ? 0.1 : weight
		} )
	}
	
	// temporarily disabled while working on from-scratch evolution
	for ( let segmentIndex = 0; segmentIndex < numSegments; segmentIndex++ ) {
		// start at current segment, add half rotation, wrap overflow
		const oppositeSegmentIndex = ( segmentIndex + Math.floor( numSegments / 2 ) ) % numSegments
		
		const foodNeuron = receptors[ segmentIndex ].neurons.food
		const oppositeFlipper = flippers[ oppositeSegmentIndex ]
		
		oppositeFlipper.neuron.weights[ foodNeuron.index ] = 0.2
		
		const otherFoodNeurons = receptors
			.filter( ( receptor, i ) => i !== segmentIndex ) // other receptors
			.map( receptor => receptor.neurons.food ) // other food neurons
		
		otherFoodNeurons.forEach( otherFoodNeuron => otherFoodNeuron.weights[ foodNeuron.index ] = -0.5 )
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
	
	// programBasicInstincts( self )
	// programNonsense( self )
	
	return self
}

Replic8or.prototype = {
	update: function ( dt ) {
		this.brain.update( dt )
		
		for ( const flipper of this.flippers ) flipper.update( dt )
		
		this.updatePhysics( dt )
		
		if ( this.energy >= 1 ) {
			this.energy = 1
			this.replicate()
		}
		
		this.energy -= this.metabolism * dt
		
		this.hungerNeuron.stimulate( Math.pow( 1 - this.energy, 2 ) * 5 * dt )
		
		if ( this.energy <= 0 ) this.die()
	},
	
	senseFood: function ( food, dt ) {
		for ( const receptor of this.receptors ) {
			const receptorPosition = Object.assign( {}, this.position )
			receptorPosition.x += Math.cos( this.rotation + receptor.angle ) * this.radius
			receptorPosition.y += Math.sin( this.rotation + receptor.angle ) * this.radius
			
			const distance = Vector2.distance( food.position, receptorPosition ) - food.radius
			const strength = 50 * ( distance < 0 ? 1 :
				1 / ( 1 + Math.pow( distance / 32, 2 ) ) )
			
			receptor.neurons.food.stimulate( strength * dt )
		}
	},
	
	senseReplicator: function ( replicator, dt ) {
		for ( const receptor of this.receptors ) {
			const receptorPosition = Object.assign( {}, this.position )
			receptorPosition.x += Math.cos( this.rotation + receptor.angle ) * this.radius
			receptorPosition.y += Math.sin( this.rotation + receptor.angle ) * this.radius
			
			const distance = Vector2.distance( replicator.position, receptorPosition ) - replicator.radius
			const strength = 50 * ( distance < 0 ? 1 :
				1 / ( 1 + Math.pow( distance / 32, 2 ) ) )
			
			receptor.neurons.replicator.stimulate( strength * dt )
		}
	},
	
	sensePredator: function ( predator, dt ) {
		for ( const receptor of this.receptors ) {
			const receptorPosition = Object.assign( {}, this.position )
			receptorPosition.x += Math.cos( this.rotation + receptor.angle ) * this.radius
			receptorPosition.y += Math.sin( this.rotation + receptor.angle ) * this.radius
			
			const distance = Vector2.distance( predator.position, receptorPosition ) - predator.radius
			const strength = 50 * ( distance < 0 ? 1 :
				1 / ( 1 + Math.pow( distance / 32, 2 ) ) )
			
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
	
	// TODO quietly -> emitEvent
	replicate: function ( quietly, mutationRate = 0.0036 ) {
		const parent = this
		const child = Replic8or( {
			radius: this.radius,
			mass: this.mass,
			drag: this.drag,
			elasticity: this.elasticity,
			
			energy: this.energy,
			metabolism: this.metabolism,
		} )
		
		// TEMP mutations
		parent.brain.neurons.forEach( ( parentNeuron, neuronIndex ) => {
			// TODO use map
			parentNeuron.weights.forEach( ( parentWeight, weightIndex ) => {
				if ( mutationRate > Math.random() ) {
					// distributed so most mutations are small, some are game-changers
					let mutation = 2 * Math.pow( Math2.randRange( -1, 1 ), 11 )
					parentWeight += mutation
				}
				
				// inhibitory sensory input is a nuisance
				if ( weightIndex === neuronIndex ) {
					parentWeight = Math2.clamp( parentWeight, 0, 1 )
				} else {
					parentWeight = Math2.clamp( parentWeight, -1, 1 )
				}
				
				child.brain.neurons[ neuronIndex ].weights[ weightIndex ] = parentWeight
			} )
			
			// child.brain.neurons[ neuronIndex ].potentialDecayRate = parentNeuron.potentialDecayRate + ( mutationRate > Math.random() ? Math.pow( Math2.randRange( -1.0, 1.0 ), 3 ) : 0 )
			child.brain.neurons[ neuronIndex ].potentialDecayRate = parentNeuron.potentialDecayRate
		} )
		
		// TODO u wot m8?
		const neuronsPerSegment = 4
		Replic8or.syncSymmetricWeights( child.brain.neurons, parent.numBodySegments, neuronsPerSegment )
		
		// TODO maybe divide parent's actual energy in half?
		parent.energy = child.energy = 0.5
		
		Vector2.set( child.position, parent.position )
		// Vector2.set( child.velocity, parent.velocity )
		
		// TEMP just looks cool
		child.flippers.forEach( flipper => flipper.flip() )
		
		// HACK replicated event causes test 'adds more replicators' to fail
		// last replicator dying triggers reset before replicator's
		// event handlers have been released
		if ( !quietly ) this.emit( 'replicated', parent, child )
		
		return child
	},
}

// temp? expose sync function for testing
// maybe refactor into support module
Replic8or.syncSymmetricWeights = ( neurons, numSegments, neuronsPerSegment ) => {
	const numSymmetricNeurons = numSegments * neuronsPerSegment
	
	for ( let segmentIndex = 1; segmentIndex < numSegments; segmentIndex++ ) {
		let neuronIndex = segmentIndex * neuronsPerSegment
		// within the current segment
		const lastNeuronIndex = neuronIndex + neuronsPerSegment - 1
		
		for ( ; neuronIndex <= lastNeuronIndex; neuronIndex++ ) {
			const neuron = neurons[ neuronIndex ]
			const equivalentNeuron = neurons[ neuronIndex % neuronsPerSegment ]
			
			neuron.potentialDecayRate = equivalentNeuron.potentialDecayRate
			
			neuron.weights = equivalentNeuron.weights.map( ( weight, weightIndex ) => {
				if ( weightIndex < numSymmetricNeurons ) {
					let equivalentWeightIndex
					
					equivalentWeightIndex  = weightIndex
					equivalentWeightIndex -= segmentIndex * neuronsPerSegment
					// equivalent indexes for low-index weights will be negative
					// wrap negative indexes
					equivalentWeightIndex += numSymmetricNeurons
					equivalentWeightIndex %= numSymmetricNeurons
					
					return equivalentNeuron.weights[ equivalentWeightIndex ]
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
				return weights[ weightIndex % neuronsPerSegment ]
			} else {
				return weight
			}
		} )
	}
}
