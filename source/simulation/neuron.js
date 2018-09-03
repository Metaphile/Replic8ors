// TODO degenerate neuron for sensory input

// TODO track sensory input per simulation tick
//
// if input is less than weight * refractory period (input is weak),
// fire at constant rate based on refractory period, reduce connection width
//
// if input is greater than weight * refractory period (input is strong),
// cap connection width at weight, fire faster than refractory period would allow

import Events from '../engine/events'
import Math2 from '../engine/math-2'

const defaultOpts = {
	potentialDecayRate: 0.0,
	refractoryPeriod: 0.3,
}

export default function Neuron( opts = {} ) {
	const self = Object.create( Neuron.prototype )
	Events( self )
	
	self.weights = []
	
	// in a biological neuron, potential typically varies from -70mV (resting) to -55mV (threshold)
	// ours is normalized to 0..1
	self.potential = 0
	self.sensoryPotential = 0
	self.gotSensoryInput = false
	
	// total inhibitory input since neuron last fired
	self.inhibitoryInput = 0
	
	self.firing = false
	self.index = -1
	
	Object.assign( self, defaultOpts, opts )
	
	return self
}

// WIP nonlinear activation function
// breaks several unit tests
export const scaleWeight = x => {
	// const y = -1 * Math.pow( x, 3 ) / ( Math.pow( x, 2 ) - 1 )
	
	// // scaleWeight(0.99)
	// if ( y === Infinity || y === -Infinity ) {
	// 	return -y
	// } else {
	// 	return y
	// }
	
	return x
};

Neuron.prototype = {
	stimulate: function ( dt, sourceIndex = this.index ) {
		const input = scaleWeight( this.weights[ sourceIndex ] ) * dt
		
		if ( !this.firing ) {
			if ( input < 0 ) {
				this.inhibitoryInput -= input
			}
			
			this.potential += input
		}
		
		if ( sourceIndex === this.index ) {
			this.sensoryPotential += input
			this.gotSensoryInput = true
		}
		
		// call to update() ensures neuron is in good state
		this.update( 0 )
	},
	
	fire: function () {
		if ( !this.firing ) {
			this.potential = 1
			this.inhibitoryInput = 0
			this.firing = true
			this.emit( 'fire' )
		}
	},
	
	update: function ( dt ) {
		if ( !this.gotSensoryInput ) {
			this.sensoryPotential = 0
		}
		
		if ( !this.firing ) {
			// decay
			const decayedPotential = this.potentialDecayRate * dt
			this.potential -= decayedPotential
			if ( decayedPotential > 0 ) this.inhibitoryInput += decayedPotential
		}
		
		if ( this.potential >= 1 ) this.fire()
		
		if ( this.firing ) {
			// drain potential over refractory period
			this.potential -= 1/this.refractoryPeriod * dt
			
			if ( this.potential <= 0 ) {
				this.firing = false
			}
		}
		
		this.potential = Math2.clamp( this.potential, 0, 1 )
	},
}
