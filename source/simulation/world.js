// TODO ditch prototype

import Events from '../engine/events'
import Vector2 from '../engine/vector-2'

export default function World() {
	const self = Object.create( World.prototype )
	Events( self )
	
	self.replicators = []
	self.foods = []
	self.predators = []
	
	return self
}

World.prototype = {
	addReplicator: function ( replicator ) {
		// TODO make like food.spoiled
		replicator.on( 'died', () => {
			const i = this.replicators.indexOf( replicator )
			this.replicators.splice( i, 1 )
			
			// notify after removing
			this.emit( 'replicator-died', replicator )
		} )
		
		replicator.on( 'replicated', ( parent, child ) => {
			// propagate replicated event before added
			this.emit( 'replicator-replicated', parent, child )
			
			this.addReplicator( child )
		} )
		
		this.replicators.push( replicator )
		
		this.emit( 'replicator-added', replicator )
	},
	
	addFood: function ( food ) {
		food.on( 'spoiled', () => {
			const i = this.foods.indexOf( food )
			this.foods.splice( i, 1 )
			
			this.emit( 'food-spoiled', food )
		} )
		
		this.foods.push( food )
		
		this.emit( 'food-added', food )
	},
	
	addPredator: function ( predator ) {
		this.predators.push( predator )
		this.emit( 'predator-added', predator )
	},
	
	removePredator: function ( predator ) {
		const index = this.predators.indexOf( predator )
		this.predators.splice( index, 1 )
		this.emit( 'predator-removed', predator )
	},
	
	update: function ( dt, t ) {
		const { replicators, foods, predators } = this
		
		// replicators-replicators
		for ( let i = 0, n = replicators.length; i < n; i++ ) {
			const replicatorA = replicators[ i ]
			
			for ( let j = i + 1; j < n; j++ ) {
				const replicatorB = replicators[ j ]
				
				replicatorA.collideWith( replicatorB, dt )
				
				replicatorA.senseReplicator( replicatorB, dt )
				replicatorB.senseReplicator( replicatorA, dt )
			}
		}
		
		// predators-predators
		for ( let i = 0, n = predators.length; i < n; i++ ) {
			const predatorA = predators[ i ]
			
			for ( let j = i + 1; j < n; j++ ) {
				const predatorB = predators[ j ]
				
				predatorA.collideWith( predatorB, dt )
			}
		}
		
		// foods-replicators
		for ( let foodIndex = 0; foodIndex < foods.length; foodIndex++ ) {
			const food = foods[ foodIndex ]
			const recipients = []
			
			for ( let replicator of replicators ) {
				const dx = food.position.x - replicator.position.x
				const dy = food.position.y - replicator.position.y
				
				const r1 = food.radius
				const r2 = replicator.radius
				
				const actual  = dx*dx + dy*dy // center to center
				const minimum = Math.pow( r1 + r2, 2 )
				
				if ( actual > minimum ) {
					replicator.senseFood( food, dt )
				} else {
					recipients.push( replicator )
				}
			}
			
			if ( recipients.length > 0 ) {
				// at least one replicator got to the food
				// if more than one, divvy up
				
				for ( let recipient of recipients ) {
					recipient.energy += food.calories / recipients.length
				}
				
				food.chomp()
				
				foods.splice( foodIndex, 1 )
				foodIndex--
				
				this.emit( 'food-eaten', food, recipients )
			}
		}
		
		// foods-predators
		for ( let foodIndex = 0; foodIndex < foods.length; foodIndex++ ) {
			const food = foods[ foodIndex ]
			
			for ( let predator of predators ) {
				const dx = food.position.x - predator.position.x
				const dy = food.position.y - predator.position.y
				
				const r1 = food.radius
				const r2 = predator.radius
				
				const actual  = dx*dx + dy*dy // center to center
				const minimum = Math.pow( r1 + r2, 2 )
				
				if ( actual < minimum ) {
					// TODO destroy method?
					// food.spoil()
					food.spoiled = true
					
					foods.splice( foodIndex, 1 )
					foodIndex--
					
					this.emit( 'food-destroyed', food, Vector2.angle( Vector2.subtract( predator.position, food.position, {} ) ) - Math.PI/2 )
				}
			}
		}
		
		// predators-replicators
		for ( let predator of predators ) {
			let nearestReplicator, shortestDistance = Infinity, shortestOffset
			
			for ( let replicator of replicators ) {
				const offset = Vector2.subtract( replicator.position, predator.position, {} )
				
				const minDistance = Math.pow( predator.radius + replicator.radius, 2 )
				const distance = Vector2.lengthSquared( offset )
				
				predator.collideWith( replicator, dt )
				
				if ( distance < minDistance ) {
					replicator.energy -= dt * 0.3
				} else {
					replicator.sensePredator( predator, dt )
					
					if ( distance < shortestDistance ) {
						nearestReplicator = replicator
						shortestDistance = distance
						shortestOffset = Vector2.clone( offset )
					}
				}
			}
			
			if ( nearestReplicator ) {
				predator.applyForce( Vector2.setLength( shortestOffset, predator.speed ), dt )
			}
		}
		
		for ( let replicator of replicators.slice( 0 ) ) {
			replicator.update( dt, t )
		}
		
		for ( let food of foods.slice( 0 ) ) {
			food.update( dt, t )
		}
		
		for ( let predator of predators ) {
			predator.update( dt )
		}
	},
}
