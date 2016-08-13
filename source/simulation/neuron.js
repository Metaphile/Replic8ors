import Events from '../engine/events'
import Math2 from '../engine/math-2'

const defaultOpts = {
	potentialDecayRate: 0.0,
	refractoryPeriod: 0.5,
}

export default function Neuron( opts = {} ) {
	const self = Object.create( Neuron.prototype )
	Events( self )
	
	self.weights = []
	
	// in a biological neuron, potential typically varies from -70mV (resting) to -55mV (threshold)
	// for convenience we normalize the resting and threshold potentials to 0 and 1 respectively
	self.potential = 0
	self.sensoryPotential = 0
	
	// for reference, we keep track of potential lost due to inhibitory input
	self.inhibitedPotential = 0
	
	self.firing = false
	self.index = -1
	
	Object.assign( self, defaultOpts, opts )
	
	return self
}

Neuron.prototype = {
	stimulate: function ( dt, sourceIndex = this.index ) {
		const input = this.weights[ sourceIndex ] * dt
		
		if ( !this.firing ) {
			if ( input < 0 && this.potential > 0 ) {
				this.inhibitedPotential += Math.min( this.potential, -input )
			}
			
			this.potential += input
		}
		
		if ( sourceIndex === this.index ) this.sensoryPotential += input
		
		// call to update() ensures neuron is in good state
		this.update( 0 )
	},
	
	fire: function () {
		if ( !this.firing ) {
			this.potential = 1
			this.inhibitedPotential = 0
			this.firing = true
			this.emit( 'fire' )
		}
	},
	
	update: function ( dt, t = dt ) {
		if ( this.potential >= 1 ) this.fire( t )
		
		if ( !this.firing ) {
			// decay
			const decayedPotential = this.potentialDecayRate * dt
			this.potential -= decayedPotential
			// if potential is zero and decay rate is positive,
			// subtract from ihnibited potential to show
			// what potential _would_ have been pre-inhibition
			// (maybe we should also check if inhibited potential is > 0,
			// but it works either way)
			if ( this.potential <= 0 && decayedPotential > 0 ) this.inhibitedPotential -= decayedPotential
		}
		
		if ( this.firing ) {
			// drain potential over refractory period
			this.potential -= 1/this.refractoryPeriod * dt
			
			if ( this.potential <= 0 ) {
				this.firing = false
			}
		}
		
		this.potential = Math2.clamp( this.potential, 0, 1 )
		
		// actual + inhibited potential shouldn't exceed 1
		// truncate inhibited if needed
		if ( this.potential + this.inhibitedPotential > 1 ) {
			this.inhibitedPotential = 1 - this.potential
		} else if ( this.inhibitedPotential < 0 ) {
			this.inhibitedPotential = 0
		}
	},
}
