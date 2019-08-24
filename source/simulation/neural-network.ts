// TODO noise in neural networks?

export default function NeuralNetwork() {
	const network = Object.create( NeuralNetwork.prototype )
	
	network.neurons = []
	
	return network
}

NeuralNetwork.prototype = {
	addNeuron: function ( newNeuron ) {
		this.neurons.push( newNeuron )
		newNeuron.index = this.neurons.indexOf( newNeuron )
		
		for ( const neuron of this.neurons ) {
			// add weight _to_ new neuron
			if ( !( neuron.index in newNeuron.weights ) ) {
				newNeuron.weights[ neuron.index ] = 0
			}
			
			// add weight _for_ new neuron
			if ( !( newNeuron.index in neuron.weights ) ) {
				neuron.weights[ newNeuron.index ] = 0
			}
		}
		
		newNeuron.on( 'fire', () => {
			return
			
			// loop over neurons here
			for ( let i = 0; i < this.neurons.length; i++ ) {
				const thisNeuron = newNeuron
				const thatNeuron = this.neurons[ i ]
				if ( thisNeuron === thatNeuron ) continue
				
				
				const thatNeuronWeight = thisNeuron.weights[ thatNeuron.index ]
				
				// penalize this neuron for sending late excitatory input to that neuron
				if ( thatNeuron.firing && thatNeuron.weights[ thisNeuron.index ] > 0 ) {
					// this neuron could've contributed but it was too late :(
					// TODO scale by lateness
					// can't figure this out right now
					// const scale = 1 - ( thatNeuron.simTimeSinceLastFired / thatNeuron.refractoryPeriod )
					thatNeuron.weights[ thisNeuron.index ] *= 0.99
				}
				
				// TODO reward late inhibitory input? can't see the point except that it would be symmetric
				
				// reward that neuron for sending excitatory input right before this neuron fired
				if ( thatNeuron.firing && thisNeuron.weights[ thatNeuron.index ] > 0 ) {
					thisNeuron.weights[ thatNeuron.index ] += ( 1 - thatNeuronWeight ) * 0.01
				}
				
				// penalize that neuron for sending inhibitory input right before this neuron fired
				if ( thatNeuron.firing && thisNeuron.weights[ thatNeuron.index ] < 0 ) {
					thisNeuron.weights[ thatNeuron.index ] *= 0.99
				}
			}
		} )
	},
	
	update: function ( dt ) {
		// propagate signals
		for ( const source of this.neurons ) {
			if ( source.firing ) {
				for ( const target of this.neurons ) {
					// TODO write test
					if ( source === target ) continue
					target.stimulate( 1 / source.refractoryPeriod * dt, source.index )
				}
			}
		}
		
		for ( const neuron of this.neurons ) {
			neuron.update( dt )
		}
	},
}
