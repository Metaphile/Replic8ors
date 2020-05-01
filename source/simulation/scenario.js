import Food from './food'
import Timer from '../engine/timer'
import Predator from './predator'
import Prey from './prey'
import RingBuffer from '../engine/ring-buffer'
import settings, { settingsEvents } from '../settings/settings'

export default function Scenario( world, opts = {} ) {
	const self = {}
	Object.assign( self, settings.scenario, opts )
	
	settingsEvents.on( 'setting-changed', ( section, key, value ) => {
		switch ( section ) {
			case 'scenario':
				switch ( key ) {
					default:
						self[ key ] = value
						break
				}
				
				break
			
			case 'predator':
				const predators = [ ...predatorCryo, ...world.predators ]
				
				predators.forEach( predator => predator[ key ] = value )
				
				switch ( key ) {
					case 'potentialDecayRate':
						for ( const predator of predators ) {
							for ( const neuron of predator.brain.neurons ) {
								neuron.potentialDecayRate = value
							}
						}
						break
				}
				
				break
			
			case 'prey':
				const preys = [ ...preyCryo, ...world.preys ]
				
				preys.forEach( prey => prey[ key ] = value )
				
				switch ( key ) {
					case 'potentialDecayRate':
						for ( const prey of preys ) {
							for ( const neuron of prey.brain.neurons ) {
								neuron.potentialDecayRate = value
							}
						}
						break
				}
				
				break
			
			case 'food':
				const foods = [ ...world.foods ]
				
				foods.forEach( food => food[ key ] = value )
				
				switch ( key ) {
					// ...
				}
				
				break
		}
	} )
	
	// archive
	const preyCryo = RingBuffer( Math.ceil( self.maxPreys / 2 ) )
	const predatorCryo = RingBuffer( Math.ceil( self.maxPredators / 2 ) )
	
	const timer = Timer()
	
	self.balancePopulations = function () {
		const excessPredators = world.predators.length - self.maxPredators
		const neededPredators = Math.ceil( self.maxPredators / 2 ) - world.predators.length
		if ( excessPredators > 0 ) {
			for ( let i = 0; i < excessPredators; i++ ) {
				// expire oldest predators
				world.predators[ i ].energy = -Infinity
			}
		} else if ( neededPredators > 0 ) {
			addPredators( neededPredators )
		}
		
		const excessPreys = world.preys.length - self.maxPreys
		const neededPreys = Math.ceil( self.maxPreys / 2 ) - world.preys.length
		if ( excessPreys > 0 ) {
			for ( let i = 0; i < excessPreys; i++ ) {
				// expire oldest preys
				world.preys[ i ].energy = -Infinity
			}
		} else if ( neededPreys > 0 ) {
			addPreys( neededPreys )
		}
		
		const excessFoods = world.foods.length - self.maxFoods
		if ( excessFoods > 0 ) {
			for ( let i = 0; i < excessFoods; i++ ) {
				// expire oldest foods
				world.foods[ i ].age = Infinity
			}
		} else if ( excessFoods < 0 ) {
			addFoods( -excessFoods )
		}
	}
	
	function createPopulation( howMany, founders, copyMember, createMember ) {
		const population = []
		
		for ( let i = 0; i < howMany; i++ ) {
			const member = founders[ i ] ? copyMember( founders[ i ] ) : createMember()
			population.push( member )
		}
		
		return population
	}
	
	const numEntityTypes = 3
	const numSpokes = numEntityTypes * 5
	
	let foodSpokeIndex = 0
	function addFoods( howMany ) {
		const ownSpokeOffset = 0
		
		for ( ; howMany > 0; howMany-- ) {
			const food = Food()
			
			const radiusScale = Math.pow( Math.random(), 1 / Math.PI )
			const radius = radiusScale * world.radius
			
			const tau = Math.PI * 2
			const minAngle = ( ( ownSpokeOffset + foodSpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) - ( tau / numSpokes / 2 )
			const maxAngle = ( ( ownSpokeOffset + foodSpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) + ( tau / numSpokes / 2 )
			const angle = minAngle + ( Math.random() * ( maxAngle - minAngle ) )
			
			food.position.x = Math.cos( angle ) * radius
			food.position.y = Math.sin( angle ) * radius
			
			world.addFood( food )
			
			foodSpokeIndex = ( foodSpokeIndex + numEntityTypes ) % numSpokes
		}
	}
	
	let preySpokeIndex = 0
	function addPreys( howMany ) {
		const ownSpokeOffset = 1
		
		createPopulation( howMany, preyCryo, prey => { prey.energy = 1; return prey.replicate( true ) }, Prey ).forEach( ( prey, i, newPreys ) => {
			const radiusScale = Math.pow( Math.random(), 1 / Math.PI )
			const radius = radiusScale * world.radius
			
			const tau = Math.PI * 2
			const minAngle = ( ( ownSpokeOffset + preySpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) - ( tau / numSpokes / 2 )
			const maxAngle = ( ( ownSpokeOffset + preySpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) + ( tau / numSpokes / 2 )
			const angle = minAngle + ( Math.random() * ( maxAngle - minAngle ) )
			
			prey.position.x = Math.cos( angle ) * radius
			prey.position.y = Math.sin( angle ) * radius
			
			world.addPrey( prey )
			
			preySpokeIndex = ( preySpokeIndex + numEntityTypes ) % numSpokes
		} )
	}
	
	let predatorSpokeIndex = 0
	function addPredators( howMany ) {
		const ownSpokeOffset = 2
		
		createPopulation( howMany, predatorCryo, predator => { predator.energy = 1; return predator.replicate( true ) }, Predator ).forEach( ( predator, i, newPredators ) => {
			const radiusScale = Math.pow( Math.random(), 1 / Math.PI )
			const radius = radiusScale * world.radius
			
			const tau = Math.PI * 2
			const minAngle = ( ( ownSpokeOffset + predatorSpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) - ( tau / numSpokes / 2 )
			const maxAngle = ( ( ownSpokeOffset + predatorSpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) + ( tau / numSpokes / 2 )
			const angle = minAngle + ( Math.random() * ( maxAngle - minAngle ) )
			
			predator.position.x = Math.cos( angle ) * radius
			predator.position.y = Math.sin( angle ) * radius
			
			world.addPredator( predator )
			
			predatorSpokeIndex = ( predatorSpokeIndex + numEntityTypes ) % numSpokes
		} )
	}
	
	self.reset = function ( hard ) {
		timer.cancelAllActions()
		
		world.foods.slice().forEach( food => food.spoil() )
		world.preys.slice().forEach( prey => prey.die() )
		world.predators.slice().forEach( predator => predator.die() )
	}
	
	world.on( 'prey-replicated', ( parent, child ) => {
		preyCryo.push( parent )
	} )
	
	world.on( 'predator-replicated', ( parent, child ) => {
		predatorCryo.push( parent )
	} )
	
	self.update = function ( dt ) {
		timer.update( dt )
		world.update( dt )
		self.balancePopulations()
	}
	
	self.reset()
	
	return self
}
