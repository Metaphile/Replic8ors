import Replic8or from './replic8or'
import { preySettings } from '../settings/settings'

export default function Prey( opts = {} ) {
	return Replic8or( {
		type: 'prey',
		...preySettings,
		...opts,
	} )
}
