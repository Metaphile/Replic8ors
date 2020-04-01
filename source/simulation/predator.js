import Replic8or from './replic8or'

export default function Predator( opts = {} ) {
	return Replic8or( {
		radius: 38,
		drag: 270,
		numInternalNeurons: 5,
		flipperStrength: 22000,
		...opts,
	} )
}
