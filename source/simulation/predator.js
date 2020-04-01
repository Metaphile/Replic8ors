import Replic8or from './replic8or'

export default function Predator( opts = {} ) {
	return Replic8or( {
		radius: 38,
		mass: 24,
		drag: 70,
		flipperStrength: 6900,
		numInternalNeurons: 5,
		...opts,
	} )
}
