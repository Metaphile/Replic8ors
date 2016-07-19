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
		
		for ( let neuron of this.neurons ) {
			// add weight _to_ new neuron
			if ( !( neuron.index in newNeuron.weights ) ) {
				newNeuron.weights[ neuron.index ] = 0
			}
			
			// add weight _for_ new neuron
			if ( !( newNeuron.index in neuron.weights ) ) {
				neuron.weights[ newNeuron.index ] = 0
			}
		}
	},
	
	update: function ( dt ) {
		for ( let neuron of this.neurons ) {
			neuron.update( dt )
		}
		
		// propagate signals
		for ( let source of this.neurons ) {
			if ( source.firing ) {
				for ( let target of this.neurons ) {
					// TODO write test
					if ( source === target ) continue
					target.stimulate( 1 / source.refractoryPeriod * dt, source.index )
				}
			}
		}
	},
}
