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
	potentialDecayRate: 0.4,
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
	self.simTimeSinceLastFired = 0
	self.index = -1
	
	// neuron input (calls to `stimulate()`) isn't applied immediately.
	// it's buffered until the next update,
	// at which point the sum of all input is applied simultaneously.
	// this gives all upstream neurons equal footing
	// and avoids intermediate state issues which were
	// previously worked around by calling `update( 0 )` inside `stimulate()`
	self.inputBuffer = []
	
	Object.assign( self, defaultOpts, opts )
	
	return self
}

Neuron.prototype = {
	stimulate: function ( dt, sourceIndex = this.index ) {
		const w = this.weights[ sourceIndex ]
		
		const input = w * dt
		
		if ( !this.firing ) {
			if ( input < 0 ) {
				this.inhibitoryInput -= input
			}
			
			this.inputBuffer.push( input )
		}
		
		if ( sourceIndex === this.index ) {
			this.sensoryPotential += input
			this.gotSensoryInput = true
		}
	},
	
	fire: function () {
		if ( !this.firing ) {
			this.potential = 1
			this.inhibitoryInput = 0
			this.firing = true
			this.simTimeSinceLastFired = 0
			this.emit( 'fire' )
		}
	},
	
	update: function ( dt ) {
		this.potential += this.inputBuffer.reduce( ( runningTotal, currentValue ) => runningTotal + currentValue, 0 )
		this.inputBuffer.length = 0
		
		this.simTimeSinceLastFired += dt
		
		if ( !this.gotSensoryInput ) {
			this.sensoryPotential = 0
		}
		
		if ( this.potential >= 1 ) this.fire()
		
		if ( !this.firing ) {
			// decay
			this.potential -= this.potentialDecayRate * dt
		}
		
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
