export default function Timer() {
	const self = {}
	const actions = []
	
	self.scheduleAction = ( delay, callback ) => {
		actions.push( { delay, callback } )
	}
	
	self.cancelAllActions = () => {
		actions.length = 0
	}
	
	self.update = ( dt ) => {
		for ( let i = 0; i < actions.length; i++ ) {
			const action = actions[ i ]
			
			action.delay -= dt
			
			if ( action.delay <= 0 ) {
				action.callback()
				
				// remove from actions array and adjust loop index
				actions.splice( i, 1 )
				i--
			}
		}
	}
	
	return self
}
