export default function Events( self = {} ) {
	let subscriptions = {}
	
	self.on = ( events, callback ) => {
		for ( const event of events.split( ' ' ) ) {
			if ( !subscriptions[ event ] ) subscriptions[ event ] = []
			subscriptions[ event ].push( callback )
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
