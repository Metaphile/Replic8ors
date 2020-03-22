import Food from './food'
import Timer from '../engine/timer'
import Predator from './predator'
import Prey from './prey'
import RingBuffer from '../engine/ring-buffer'

const defaultOpts = {
	numPreys:        7,
	maxPreys:       13,
	numPredators:    5,
	maxPredators:   11,
}

// TODO exported for testability; need tests
export function createPopulation( howMany, founders, copyMember, createMember ) {
	const population = []
	
	for ( let i = 0; i < howMany; i++ ) {
		const member = founders[ i ] ? copyMember( founders[ i ] ) : createMember()
		population.push( member )
	}
	
	return population
}

export default function Scenario( world, opts = {} ) {
	const self = {}
	Object.assign( self, defaultOpts, opts )
	
	// archive
	const preyCryo = RingBuffer( self.numPreys )
	const predatorCryo = RingBuffer( self.numPredators )
	
	const timer = Timer()
	
	function addFoods( howMany, center, minRadius, maxRadius ) {
		for ( ; howMany > 0; howMany-- ) {
			const food = Food()
			
			const angle = Math.random() * Math.PI * 2
			const radius = minRadius + ( Math.random() * ( maxRadius - minRadius ) )
			
			food.position.x = center.x + Math.cos( angle ) * radius
			food.position.y = center.y + Math.sin( angle ) * radius
			
			world.addFood( food )
		}
	}
	
	self.repopulatePrey = function () {
		createPopulation( self.numPreys - 1, preyCryo, prey => { prey.energy = 1; return prey.replicate( true ) }, Prey ).forEach( ( prey ) => {
			const minRadius = world.radius * 1/3
			const maxRadius = world.radius * 2/3
			
			const angle = Math.random() * Math.PI * 2
			const radius = minRadius + ( Math.random() * ( maxRadius - minRadius ) )
			prey.position.x = Math.cos( angle ) * radius
			prey.position.y = Math.sin( angle ) * radius
			
			// prey.rotation = Math.random() * Math.PI * 2
			
			world.addPrey( prey )
		} )
	},
	
	self.repopulatePrey()
	
	self.repopulatePredators = function () {
		createPopulation( self.numPredators, predatorCryo, predator => { predator.energy = 1; return predator.replicate( true ) }, Predator ).forEach( ( predator ) => {
			const minRadius = world.radius * 0/3
			const maxRadius = world.radius * 2/3
			
			const angle = Math.random() * Math.PI * 2
			const radius = minRadius + ( Math.random() * ( maxRadius - minRadius ) )
			predator.position.x = Math.cos( angle ) * radius
			predator.position.y = Math.sin( angle ) * radius
			
			// predator.rotation = Math.random() * Math.PI * 2
			
			world.addPredator( predator )
		} )
	},
	
	self.repopulatePredators()
	
	self.reset = function ( hard ) {
		timer.cancelAllActions()
		
		// remove any existing preys, predators
		// TODO better way of removing replicators than killing them?
		world.preys.slice().forEach( prey => prey.die() )
		world.predators.slice().forEach( predator => predator.die() )
		
		function feedPrey() {
			if ( self.feeding ) {
				addFoods( 10, { x: 0, y: 0 }, world.radius * 2/3, world.radius * 3/3 )
			}
			
			timer.scheduleAction( 1, feedPrey )
		}
		
		self.feeding = true
		
		feedPrey()
		
		// remove any existing foods
		// TODO better way of removing foods than spoiling them?
		world.foods.slice().forEach( food => food.spoil() )
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
		
		if ( world.preys.length === 0 && world.predators.length <= self.maxPredators ) {
			self.repopulatePrey()
		}
		
		if ( world.predators.length === 0 ) {
			self.repopulatePredators()
		}
		
		const areTooManyFoods = world.foods.length > 37
		const areAnyPreys = world.preys.length > 0
		const areTooManyPreys = world.preys.length > self.maxPreys
		const areAnyPredators = world.predators.length > 0
		const areTooManyPredators = world.predators.length > self.maxPredators
		
		if ( areTooManyFoods ) {
			// simplest case: if there's too much food in the environment, don't add more
			self.feeding = false
		} else if ( !areTooManyPreys && !areTooManyPredators ) {
			// if there aren't too many preys AND there aren't too many predators, add more food
			self.feeding = true
		} else if ( areTooManyPreys ) {
			// if there are too many preys, reduce the prey population by withholding food
			self.feeding = false
		} else if ( areTooManyPredators && areAnyPreys ) {
			// if there are too many predators, reduce the predator population by reducing the prey population
			// (by withholding food)
			self.feeding = false
		} else if ( areAnyPredators && !areAnyPreys ) {
			// if there are predators but no prey, resume feeding for two reasons:
			// - food is harmful to predators and will help reduce their population
			// - when fresh prey are added, they'll have something to eat
			self.feeding = true
		}
	}
	
	self.reset()
	
	return self
}
