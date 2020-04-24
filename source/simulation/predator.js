import Replic8or from './replic8or'
import { predatorSettings } from '../settings/settings'

export default function Predator( opts = {} ) {
	return Replic8or( {
		type: 'predator',
		...predatorSettings,
		...opts,
	} )
}
