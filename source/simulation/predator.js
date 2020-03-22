import Replic8or from './replic8or'

export default function Predator( opts = {} ) {
	return Replic8or( {
		radius: 64,
		flipperStrength: 6500,
		...opts,
	} )
}
