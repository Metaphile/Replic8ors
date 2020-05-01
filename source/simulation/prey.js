import Replic8or from './replic8or'
import settings from '../settings/settings'

export default function Prey( opts = {} ) {
	return Replic8or( {
		type: 'prey',
		...settings.prey,
		...opts,
	} )
}
