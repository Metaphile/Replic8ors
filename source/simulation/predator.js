import Replic8or from './replic8or'
import settings from '../settings/settings'

export default function Predator( opts = {} ) {
	return Replic8or( {
		type: 'predator',
		...settings.predator,
		...opts,
	} )
}
