import Events from '../engine/events'
import {
	areCloserThan,
	transferEnergyBetween,
} from './world-helpers'

export default function World() {
	const self = Object.create( World.prototype )
	Events( self )
	
	self.foods = []
	self.preys = []
	self.predators = []
	self.radius = 640
	// for sense function with curve height = 700, curve width = 5
	// strength is pretty close to 0 after 200 units
	self.maxSenseRadius = 200
	
	return self
}

World.prototype = {
	addFood: function ( food ) {
		food.on( 'spoiled', () => {
			const i = this.foods.indexOf( food )
			this.foods.splice( i, 1 )
			
			this.emit( 'food-spoiled', food )
		} )
		
		food.on( 'eaten', () => {
			const i = this.foods.indexOf( food )
			this.foods.splice( i, 1 )
			
			this.emit( 'food-eaten', food )
		} )
		
		this.foods.push( food )
		
		this.emit( 'food-added', food )
	},
	
	addPrey: function ( prey ) {
		// TODO make like food.spoiled
		prey.on( 'died', () => {
			const i = this.preys.indexOf( prey )
			this.preys.splice( i, 1 )
			
			// notify after removing
			this.emit( 'prey-died', prey )
		} )
		
		prey.on( 'replicated', ( parent, child ) => {
			// propagate replicated event before added
			this.emit( 'prey-replicated', parent, child )
			
			this.addPrey( child )
		} )
		
		this.preys.push( prey )
		
		this.emit( 'prey-added', prey )
	},
	
	addPredator: function ( predator ) {
		predator.on( 'died', () => {
			const i = this.predators.indexOf( predator )
			this.predators.splice( i, 1 )
			
			// notify after removing
			this.emit( 'predator-died', predator )
		} )
		
		predator.on( 'replicated', ( parent, child ) => {
			// propagate replicated event before added
			this.emit( 'predator-replicated', parent, child )
			
			this.addPredator( child )
		} )
		
		this.predators.push( predator )
		
		this.emit( 'predator-added', predator )
	},
	
	update: function ( dt ) {
		const { foods, preys, predators } = this
		
		// interactions / collisions
		
		// predators-predators / preys-preys / predators-preys / preys-predators
		{
			const entities = [ ...predators, ...preys ]
			
			for ( let i = 0, n = entities.length; i < n; i++ ) {
				const a = entities[ i ]
				
				for ( let j = i + 1; j < n; j++ ) {
					const b = entities[ j ]
					
					if ( areCloserThan( a, b, this.maxSenseRadius ) ) {
						a.sense( b, dt )
						b.sense( a, dt )
						
						if ( areCloserThan( a, b, 0 ) ) {
							// physics
							a.collideWith( b, dt )
							
							a.currentColliders.push( b )
							b.currentColliders.push( a )
							
							if ( !a.previousColliders.includes( b ) ) {
								transferEnergyBetween( a, b )
							}
						}
					}
				}
			}
		}
		
		// foods-foods
		{
			for ( let i = 0, n = foods.length; i < n; i++ ) {
				const a = foods[ i ]
				
				for ( let j = i + 1; j < n; j++ ) {
					const b = foods[ j ]
					
					if ( areCloserThan( a, b, 0 ) ) {
						// physics
						a.collideWith( b, dt )
						
						a.currentColliders.push( b )
						b.currentColliders.push( a )
						
						if ( !a.previousColliders.includes( b ) ) {
							transferEnergyBetween( a, b )
						}
					}
				}
			}
		}
		
		// predators-foods / preys-foods / foods-predators / foods-preys
		for ( const replicator of [ ...predators, ...preys ] ) {
			for ( const food of foods ) {
				if ( areCloserThan( replicator, food, this.maxSenseRadius ) ) {
					replicator.sense( food, dt )
					
					if ( areCloserThan( replicator, food, 0 ) ) {
						// physics
						replicator.collideWith( food, dt )
						
						replicator.currentColliders.push( food )
						food.currentColliders.push( replicator )
						
						if ( !replicator.previousColliders.includes( food ) ) {
							transferEnergyBetween( replicator, food )
						}
					}
				}
			}
		}
		
		// updates
		
		for ( const entity of [ ...predators, ...preys, ...foods ] ) {
			entity.previousColliders = [ ...entity.currentColliders ]
			entity.currentColliders = []
			
			entity.update( dt )
		}
	},
}
