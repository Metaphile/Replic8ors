import Food from './food'
import Timer from '../engine/timer'
import Replic8or from './replic8or'
import RingBuffer from '../engine/ring-buffer'

const defaultOpts = {
	numReplicators: 16,
	maxReplicators: 24,
	numPredators:    8,
	maxPredators:   16,
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
	const replicatorCryo = RingBuffer( self.numReplicators )
	const predatorCryo = RingBuffer( self.numPredators )
	
	const timer = Timer()
	
	self.doBloom = function ( position, radius, density ) {
		for ( ; density > 0; density-- ) {
			// spawn foods one after another
			const food = Food()
			
			const angle = Math.random() * Math.PI * 2
			// const radius2 = ( radius * 0.8 ) + Math.random() * radius * 0.4
			const radius2 = Math.pow( Math.random(), 0.8) * radius
			food.position.x = position.x + Math.cos( angle ) * radius2
			food.position.y = position.y + Math.sin( angle ) * radius2
			
			world.addFood( food )
		}
	}
	
	const stats = {
		firstTime:          true,
		
		predatorsWon:       false,
		preyWon:            false,
		
		predatorScore:      0,
		preyScore:          0,
		
		elapsedRealTime:    0,
		elapsedSimTime:     0,
		elapsedSimTimeMax:  0,
		
		// currently unused
		timeRatio:          1, // sim to elapsed
	}
	
	const statsStrings = {
		winner:             '-', // 'Red' / 'Green'
		
		// TODO elapsedRealTime
		elapsedSimTime:     '',
		elapsedSimTimeMax:  '',
		
		// TODO timeRatio
	}
	
	self.repopulatePrey = function () {
		createPopulation( self.numReplicators - 1, replicatorCryo, replicator => replicator.replicate( true ), Replic8or ).forEach( ( replicator ) => {
			const angle = Math.random() * Math.PI * 2
			const radius2 = 0 + Math.random() * ( 640 - 0 )
			replicator.position.x = Math.cos( angle ) * radius2
			replicator.position.y = Math.sin( angle ) * radius2
			
			replicator.rotation = Math.random() * Math.PI * 2
			
			world.addReplicator( replicator )
		} )
	},
	
	self.repopulatePrey()
	
	self.repopulatePredators = function () {
		createPopulation( self.numPredators, predatorCryo, predator => predator.replicate( true ), Replic8or ).forEach( ( predator ) => {
			const angle = Math.random() * Math.PI * 2
			const radius2 = 0 + Math.random() * ( 640 - 0 )
			predator.position.x = Math.cos( angle ) * radius2
			predator.position.y = Math.sin( angle ) * radius2
			
			predator.rotation = Math.random() * Math.PI * 2
			
			world.addPredator( predator )
		} )
	},
	
	self.repopulatePredators()
	
	// TODO instead of resetting scenario, incrementally replenish predators/prey to keep simulation going
	self.reset = function ( hard ) {
		// stats
		{
			// scenario resets when the last predator dies
			// if there are no prey when the last predator dies, predators outlasted prey and "won" the round
			if ( !stats.firstTime && world.replicators.length === 0 ) {
				stats.predatorsWon = true
				stats.preyWon = false
				
				stats.predatorScore++
				
				statsStrings.winner = 'Reds  ' // extra spaces for alignment
			// if there are prey when the last predator dies, prey won
			} else if ( !stats.firstTime && world.replicators.length > 0 ) {
				stats.predatorsWon = false
				stats.preyWon = true
				
				stats.preyScore++
				
				statsStrings.winner = 'Greens'
			}
			
			statsStrings.predatorScore = stats.predatorScore
			statsStrings.preyScore     = stats.preyScore
			
			// new time record?
			stats.elapsedSimTimeMax = Math.max( stats.elapsedSimTimeMax, stats.elapsedSimTime )
			
			statsStrings.elapsedSimTime    = Math.round( stats.elapsedSimTime )    + 's'
			statsStrings.elapsedSimTimeMax = Math.round( stats.elapsedSimTimeMax ) + 's'
			
			const s = statsStrings
			console.log( `${s.winner} | ${s.predatorScore}-${s.preyScore} | ${s.elapsedSimTime} (${s.elapsedSimTimeMax})` )
			
			// reset some stats
			stats.firstTime = false
			// TODO elapsedRealTime
			stats.elapsedSimTime = 0
		}
		
		timer.cancelAllActions()
		
		// remove any existing replicators, predators
		// TODO better way of removing replicators than killing them?
		world.replicators.slice().forEach( replicator => replicator.die() )
		world.predators.slice().forEach( replicator => replicator.die() )
		
		// repopulate world from frozen specimens
		// shortly after first bloom
		
		function feedPrey() {
			const foodSpawnRadius = 640
			
			if ( self.feeding && world.foods.length < 100 ) {
				self.doBloom( { x: 0, y: 0 }, foodSpawnRadius, 24 )
			}
			
			timer.scheduleAction( 10, feedPrey )
		}
		
		self.feeding = true
		
		feedPrey()
		
		// remove any existing foods
		// TODO better way of removing foods than spoiling them?
		world.foods.slice().forEach( food => food.spoil() )
	}
	
	world.on( 'replicator-replicated', ( parent, child ) => {
		replicatorCryo.push( parent )
	} )
	
	world.on( 'predator-replicated', ( parent, child ) => {
		predatorCryo.push( parent )
	} )
	
	// TODO will we be needing t for anything?
	self.update = function ( dt, t ) {
		timer.update( dt )
		world.update( dt )
		
		if ( world.replicators.length === 0 && world.predators.length <= self.maxPredators ) {
			self.repopulatePrey()
		}
		
		if ( world.predators.length === 0 ) {
			self.repopulatePredators()
		}
		
		const areTooManyFoods = world.foods.length > 90
		const areAnyPreys = world.replicators.length > 0
		const areTooManyPreys = world.replicators.length > self.maxReplicators
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
		
		stats.elapsedSimTime += dt
	}
	
	self.reset()
	
	return self
}

// TODO implement learning next
