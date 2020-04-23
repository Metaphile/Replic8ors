import Replic8or from './replic8or'

export default function Predator( opts = {} ) {
	return Replic8or( {
		type: 'predator',
		radius: 39,
		numInternalNeurons: 3,
		flipperStrength: 22000,
		...opts,
	} )
}
