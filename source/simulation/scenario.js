import Food from './food'
import Timer from '../engine/timer'
import Predator from './predator'
import Prey from './prey'
import RingBuffer from '../engine/ring-buffer'

const defaultOpts = {
	maxFoods:       21,
	maxPreys:       13,
	maxPredators:   11,
}

export default function Scenario( world, opts = {} ) {
	const self = {}
	Object.assign( self, defaultOpts, opts )
	
	// archive
	const preyCryo = RingBuffer( Math.ceil( self.maxPreys / 2 ) )
	const predatorCryo = RingBuffer( Math.ceil( self.maxPredators / 2 ) )
	
	const timer = Timer()
	
	const foodQueue = []
	const preyQueue = []
	const predatorQueue = []
	
	self.getNumFoods = () => world.foods.length + foodQueue.length
	self.getNumPreys = () => world.preys.length + preyQueue.length
	self.getNumPredators = () => world.predators.length + predatorQueue.length
	
	self.balancePopulations = function () {
		const areTooManyFoods = self.getNumFoods() > self.maxFoods
		const areAnyPreys = self.getNumPreys() > 0
		const areTooManyPreys = self.getNumPreys() > self.maxPreys
		const areAnyPredators = self.getNumPredators() > 0
		const areTooManyPredators = self.getNumPredators() > self.maxPredators
		
		if ( !areTooManyFoods && !areTooManyPreys && !areTooManyPredators ) {
			addFoods( self.maxFoods - self.getNumFoods() )
		}
		
		if ( !areAnyPreys && !areTooManyPredators ) {
			addPreys( Math.ceil( self.maxPreys / 2 ) - self.getNumPreys() )
		}
		
		if ( !areAnyPredators ) {
			addPredators( Math.ceil ( self.maxPredators / 2 ) - self.getNumPredators() )
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
	
	const spawnDelay = 0.2
	
	function addFoods( howMany ) {
		const minRadius = world.radius * 2/3
		const maxRadius = world.radius * 3/3
		
		for ( ; howMany > 0; howMany-- ) {
			const food = Food()
			
			const angle = Math.random() * Math.PI * 2
			const radius = minRadius + ( Math.random() * ( maxRadius - minRadius ) )
			
			food.position.x = Math.cos( angle ) * radius
			food.position.y = Math.sin( angle ) * radius
			
			foodQueue.push( food )
			
			const preDelay = 1
			
			timer.scheduleAction( preDelay + ( foodQueue.length * spawnDelay ), () => {
				world.addFood( foodQueue.pop() )
			} )
		}
	}
	
	function addPreys( howMany ) {
		const minRadius = world.radius * 1/3
		const maxRadius = world.radius * 2/3
		
		createPopulation( howMany, preyCryo, prey => { prey.energy = 1; return prey.replicate( true ) }, Prey ).forEach( ( prey, i, newPreys ) => {
			const angle = Math.random() * Math.PI * 2
			const radius = minRadius + ( Math.random() * ( maxRadius - minRadius ) )
			prey.position.x = Math.cos( angle ) * radius
			prey.position.y = Math.sin( angle ) * radius
			
			preyQueue.push( prey )
			
			const preDelay = 2
			
			timer.scheduleAction( preDelay + ( preyQueue.length * spawnDelay ), () => {
				world.addPrey( preyQueue.pop() )
			} )
		} )
	}
	
	function addPredators( howMany ) {
		const minRadius = world.radius * 0/3
		const maxRadius = world.radius * 2/3
		
		createPopulation( howMany, predatorCryo, predator => { predator.energy = 1; return predator.replicate( true ) }, Predator ).forEach( ( predator, i, newPredators ) => {
			const angle = Math.random() * Math.PI * 2
			const radius = minRadius + ( Math.random() * ( maxRadius - minRadius ) )
			predator.position.x = Math.cos( angle ) * radius
			predator.position.y = Math.sin( angle ) * radius
			
			predatorQueue.push( predator )
			
			const preDelay = 3
			
			timer.scheduleAction( preDelay + ( predatorQueue.length * spawnDelay ), () => {
				world.addPredator( predatorQueue.pop() )
			} )
		} )
	}
	
	self.reset = function ( hard ) {
		timer.cancelAllActions()
		
		foodQueue.length = 0
		preyQueue.length = 0
		predatorQueue.length = 0
		
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
