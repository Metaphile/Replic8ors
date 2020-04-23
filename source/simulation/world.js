import Events from '../engine/events'
import Vector2 from '../engine/vector-2'

export default function World() {
	const self = Object.create( World.prototype )
	Events( self )
	
	self.foods = []
	self.preys = []
	self.predators = []
	self.radius = 460
	
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
		
		// collisions
		
		// foods-foods
		for ( let i = 0, n = foods.length; i < n; i++ ) {
			const foodA = foods[ i ]
			
			for ( let j = i + 1; j < n; j++ ) {
				const foodB = foods[ j ]
				
				foodA.collideWith( foodB, dt )
			}
		}
		
		// foods-preys / preys-foods
		for ( let foodIndex = 0; foodIndex < foods.length; foodIndex++ ) {
			const food = foods[ foodIndex ]
			const recipients = []
			
			for ( const prey of preys ) {
				const dx = food.position.x - prey.position.x
				const dy = food.position.y - prey.position.y
				
				const r1 = food.radius
				const r2 = prey.radius
				
				const actual  = dx*dx + dy*dy // center to center
				const minimum = Math.pow( r1 + r2, 2 )
				
				if ( actual > minimum ) {
					prey.sense( food, dt )
				} else {
					recipients.push( prey )
				}
			}
			
			if ( recipients.length > 0 ) {
				// at least one prey got to the food
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
		
		// preys-preys
		for ( let i = 0, n = preys.length; i < n; i++ ) {
			const preyA = preys[ i ]
			
			for ( let j = i + 1; j < n; j++ ) {
				const preyB = preys[ j ]
				
				preyA.collideWith( preyB, dt )
				
				preyA.sense( preyB, dt )
				preyB.sense( preyA, dt )
			}
		}
		
		// preys-predators / predators-preys
		for ( const prey of preys ) {
			prey.takingDamage = false
			
			for ( const predator of predators ) {
				const distance = Vector2.distance( predator.position, prey.position )
				
				if ( distance < predator.radius + prey.radius ) {
					// prey.takingDamage = true
					
					// // transfer energy,
					// // don't transfer more than is available
					
					// const take = dt * 0.5
					// const mult = 1.9
					
					// if ( prey.energy <= 0 || prey.dead ) {
					// 	// do nothing
					// } else if ( prey.energy < take ) {
					// 	predator.energy += prey.energy * mult
					// 	this.emit( 'predator-eating-prey', predator, prey )
					// 	prey.energy = 0
					// } else {
					// 	predator.energy += take * mult
					// 	this.emit( 'predator-eating-prey', predator, prey )
					// 	prey.energy -= take
					// }
					
					predator.collideWith( prey, dt )
					
					if ( prey.energy > 0 ) {
						this.emit( 'predator-eating-prey', predator, prey )
						predator.energy += prey.energy * 2
						prey.energy = 0
					}
				}
				
				prey.sense( predator, dt )
				predator.sense( prey, dt )
			}
		}
		
		// foods-predators / predators-foods
		for ( const predator of this.predators ) {
			predator.takingDamage = false
			
			for ( const food of this.foods ) {
				predator.sense( food, dt )
				
				if ( Vector2.distance( predator.position, food.position ) < predator.radius + food.radius ) {
					predator.takingDamage = true
					
					const damage = 0.2 * dt
					
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
				
				predatorA.sense( predatorB, dt )
				predatorB.sense( predatorA, dt )
				
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
		
		for ( const prey of preys.slice( 0 ) ) {
			prey.update( dt )
		}
		
		for ( const food of foods.slice( 0 ) ) {
			food.update( dt )
		}
		
		for ( const predator of predators.slice( 0 ) ) {
			predator.update( dt )
		}
		
		// constrain entities to radius
		// for ( const entity of [ ...predators, ...preys, ...foods ] ) {
		// 	const p = entity.position
		// 	const dist = Vector2.getLength( p )
		// 	if ( dist > this.radius ) {
		// 		Vector2.setLength( p, this.radius )
		// 	}
		// }
	},
}
