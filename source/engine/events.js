export default function Events( self = {} ) {
	let subscriptions = {}
	
	self.on = ( event, callback ) => {
		if ( !subscriptions[ event ] ) subscriptions[ event ] = []
		subscriptions[ event ].push( callback )
	}
	
	self.off = () => {
		subscriptions = {}
	}
	
	self.emit = ( event, ...args ) => {
		const callbacks = subscriptions[ event ]
		
		if ( callbacks ) {
			for ( let callback of callbacks ) {
				callback( ...args )
			}
		}
	}
	
	return self
}
