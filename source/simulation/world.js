import Events from '../engine/events'
import {
	areCloserThan,
	transferEnergyBetween,
} from './world-helpers'

export default function World() {
	const self = Object.create( World.prototype )
	Events( self )
	
	self.reds = []
	self.greens = []
	self.blues = []
	
	self.radius = 460
	
	// for sense function with curve height = 700, curve width = 5
	// strength is pretty close to 0 after 200 units
	self.maxSenseRadius = 200
	
	return self
}

World.prototype = {
	addBlue: function ( blue ) {
		blue.on( 'died', () => {
			const i = this.blues.indexOf( blue )
			this.blues.splice( i, 1 )
			
			// notify after removing
			this.emit( 'replicator-died', blue )
		} )
		
		blue.on( 'replicated', ( parent, child ) => {
			// propagate replicated event before added
			this.emit( 'replicator-replicated', parent, child )
			
			this.addBlue( child )
		} )
		
		this.blues.push( blue )
		
		this.emit( 'replicator-added', blue )
	},
	
	addPrey: function ( prey ) {
		prey.on( 'died', () => {
			const i = this.greens.indexOf( prey )
			this.greens.splice( i, 1 )
			
			// notify after removing
			this.emit( 'replicator-died', prey )
		} )
		
		prey.on( 'replicated', ( parent, child ) => {
			// propagate replicated event before added
			this.emit( 'replicator-replicated', parent, child )
			
			this.addPrey( child )
		} )
		
		this.greens.push( prey )
		
		this.emit( 'replicator-added', prey )
	},
	
	addPredator: function ( predator ) {
		predator.on( 'died', () => {
			const i = this.reds.indexOf( predator )
			this.reds.splice( i, 1 )
			
			// notify after removing
			this.emit( 'replicator-died', predator )
		} )
		
		predator.on( 'replicated', ( parent, child ) => {
			// propagate replicated event before added
			this.emit( 'replicator-replicated', parent, child )
			
			this.addPredator( child )
		} )
		
		this.reds.push( predator )
		
		this.emit( 'replicator-added', predator )
	},
	
	update: function ( dt ) {
		const replicators = [ ...this.reds, ...this.greens, ...this.blues ]
		
		for ( let i = 0, n = replicators.length; i < n; i++ ) {
			const a = replicators[ i ]
			
			for ( let j = i + 1; j < n; j++ ) {
				const b = replicators[ j ]
				
				if ( areCloserThan( a, b, this.maxSenseRadius ) ) {
					a.sense( b, dt )
					b.sense( a, dt )
					
					if ( areCloserThan( a, b, 0 ) ) {
						// physics
						a.collideWith( b, dt )
						
						a.currentColliders.push( b )
						b.currentColliders.push( a )
						
						if ( !a.previousColliders.includes( b ) ) {
							this.emit( 'collision', a, b )
							transferEnergyBetween( a, b )
						}
					}
				}
			}
		}
		
		// updates
		for ( const replicator of replicators ) {
			replicator.previousColliders = [ ...replicator.currentColliders ]
			replicator.currentColliders = []
			
			replicator.update( dt )
		}
	},
}
