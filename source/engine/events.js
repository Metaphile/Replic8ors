export default function Events( self = {} ) {
	let subscriptions = {}
	
	self.on = ( events, callback ) => {
		for ( const event of events.split( ' ' ) ) {
			if ( !subscriptions[ event ] ) subscriptions[ event ] = []
			subscriptions[ event ].push( callback )
		}
		
		return {
			unsubscribe() {
				for ( const event of events.split( ' ' ) ) {
					if ( !subscriptions[ event ] ) {
						continue
					}
					
					const i = subscriptions[ event ].indexOf( callback )
					
					if ( i > -1 ) {
						subscriptions[ event ].splice( i, 1 )
					}
				}
			},
		}
	}
	
	self.off = () => {
		subscriptions = {}
	}
	
	self.emit = ( event, ...args ) => {
		const callbacks = subscriptions[ event ]
		
		if ( callbacks ) {
			for ( const callback of callbacks ) {
				callback( ...args )
			}
		}
	}
	
	return self
}
