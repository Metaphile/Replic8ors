export default function Timer() {
	const self = {}
	const alarms = []
	
	self.setAlarm = ( wait, callback ) => {
		alarms.push( { wait, callback } )
	}
	
	self.cancelAlarms = () => {
		alarms.length = 0
	}
	
	self.update = ( dt ) => {
		for ( let i = 0; i < alarms.length; i++ ) {
			const alarm = alarms[ i ]
			
			alarm.wait -= dt
			
			if ( alarm.wait <= 0 ) {
				alarm.callback()
				
				// remove from alarms array and adjust loop index
				alarms.splice( i, 1 )
				i--
			}
		}
	}
	
	return self
}
