// this module implements a World factory
// a world is a container for predators, prey, etc.
// typically there will only be one world (defacto singleton)

// replicators shouldn't replicate themselves
// controller should determine when replication is appropriate (could be food-based, time-based, whatever)
// replicator provides replicate method
// maybe should provide clone method instead
// then controller does mutations, whatever other adjustments

// simulation controller notes:
// controller drives world and visualization
// controller subscribes to world events and updates world; on world events, controller calls visualization methods
// visualization.playPreySpawnAnimation( ... ).then( () => visualization.addPrey( prey ) )
// spawn animation could be tiny dot that quickly grows to full-size replicator, with bouncy finish

// animation methods should return promises
// is there a way to cancel a promise from the outside?

// to support multiple visualizations,
// main controller should have methods like
// addOrganicVisualization()
// addGraphVisualization()
// addTerminalVisualization()

// TODO ditch prototype

import Events from '../engine/events'
import Vector2 from '../engine/vector-2'

export default function World() {
	const self = Object.create( World.prototype )
	Events( self )
	
	self.foods = []
	self.replicators = []
	self.predators = []
	self.radius = 640
	
	return self
}

World.prototype = {
	addFood: function ( food ) {
		food.on( 'spoiled', () => {
			const i = this.foods.indexOf( food )
			this.foods.splice( i, 1 )
			
			this.emit( 'food-spoiled', food )
		} )
		
		this.foods.push( food )
		
		this.emit( 'food-added', food )
	},
	
	// TODO replicator -> prey (instance of replicator)
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
		const { foods, replicators, predators } = this
		
		// collisions
		
		// foods-replicators / replicators-foods
		for ( let foodIndex = 0; foodIndex < foods.length; foodIndex++ ) {
			const food = foods[ foodIndex ]
			const recipients = []
			
			for ( const replicator of replicators ) {
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
				
				for ( const recipient of recipients ) {
					recipient.energy += food.calories / recipients.length
				}
				
				food.chomp()
				
				foods.splice( foodIndex, 1 )
				foodIndex--
				
				this.emit( 'food-eaten', food, recipients )
			}
		}
		
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
		
		// replicators-predators / predators-replicators
		for ( const replicator of replicators ) {
			replicator.takingDamage = false
			
			for ( const predator of predators ) {
				const distance = Vector2.distance( predator.position, replicator.position )
				
				if ( distance < predator.radius + replicator.radius ) {
					// replicator.takingDamage = true
					
					// // transfer energy,
					// // don't transfer more than is available
					
					// const take = dt * 0.5
					// const mult = 2
					
					// if ( replicator.energy <= 0 || replicator.dead ) {
					// 	// do nothing
					// } else if ( replicator.energy < take ) {
					// 	predator.energy += replicator.energy * mult
					// 	this.emit( 'predator-eating-prey', predator, replicator )
					// 	replicator.energy = 0
					// } else {
					// 	predator.energy += take * mult
					// 	this.emit( 'predator-eating-prey', predator, replicator )
					// 	replicator.energy -= take
					// }
					
					// predator.collideWith( replicator, dt )
					
					if ( replicator.energy > 0 ) {
						replicator.energy = 0
						predator.energy = 1
					}
				}
				
				replicator.sensePredator( predator, dt )
				predator.senseReplicator( replicator, dt )
			}
		}
		
		// foods-predators / predators-foods
		for ( const predator of this.predators ) {
			predator.takingDamage = false
			
			for ( const food of this.foods ) {
				predator.senseFood( food, dt )
				
				if ( Vector2.distance( predator.position, food.position ) < predator.radius + food.radius ) {
					predator.takingDamage = true
					
					const damage = 0.04 * dt
					
					if ( predator.energy <= 0) {
						// do nothing
					} else if ( predator.energy < damage ) {
						predator.energy = 0
					} else {
						predator.energy -= damage
					}
					
					predator.collideWith( food, dt )
				}
			}
		}
		
		// predators-predators
		for ( let i = 0, n = predators.length; i < n; i++ ) {
			const predatorA = predators[ i ]
			
			for ( let j = i + 1; j < n; j++ ) {
				const predatorB = predators[ j ]
				
				predatorA.collideWith( predatorB, dt )
				
				predatorA.sensePredator( predatorB, dt )
				predatorB.sensePredator( predatorA, dt )
				
				// when predators are touching, equalize their energy levels
				// {
				// 	const dx = predatorB.position.x - predatorA.position.x
				// 	const dy = predatorB.position.y - predatorA.position.y
					
				// 	const r1 = predatorA.radius
				// 	const r2 = predatorB.radius
					
				// 	const actual  = dx*dx + dy*dy // center to center
				// 	const minimum = Math.pow( r1 + r2, 2 )
					
				// 	if ( actual <= minimum ) {
				// 		const diff = predatorB.energy - predatorA.energy
				// 		const transferRate = 1 // 1 == 1 unit of energy per second
				// 		predatorA.energy += diff * dt * transferRate
				// 		predatorB.energy -= diff * dt * transferRate
				// 	}
				// }
			}
		}
		
		// updates
		
		for ( const replicator of replicators.slice( 0 ) ) {
			replicator.update( dt )
		}
		
		for ( const food of foods.slice( 0 ) ) {
			food.update( dt )
		}
		
		for ( const predator of predators.slice( 0 ) ) {
			predator.update( dt )
		}
		
		// constrain entities to radius
		// for ( const entity of [ ...predators, ...replicators, ...foods ] ) {
		// 	const p = entity.position
		// 	const dist = Vector2.getLength( p )
		// 	if ( dist > this.radius ) {
		// 		Vector2.setLength( p, this.radius )
		// 	}
		// }
	},
}
