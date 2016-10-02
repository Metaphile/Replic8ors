import Food from './food'
import Timer from '../engine/timer'
import Replic8or from './replic8or'
import Predator from './predator'
import RingBuffer from '../engine/ring-buffer'

const defaultOpts = {
	designatedWidth:  580,
	designatedHeight: 480,
	numReplicators: 5,
	// numPredators: 2,
}

export default function Scenario( world, opts = {} ) {
	const self = {}
	Object.assign( self, defaultOpts, opts )
	
	// archive
	const cryo = RingBuffer( self.numReplicators )
	// const seed = Replic8or()
	// for ( let n = self.numReplicators; n > 0; n-- ) cryo.push( seed.replicate() )
	for ( let n = self.numReplicators; n > 0; n-- ) cryo.push( Replic8or() )
	
	const timer = Timer()
	
	self.doBloom = function ( position, radius, density ) {
		for ( ; density > 0; density-- ) {
			// spawn foods one after another
			timer.setAlarm( density * 0.3, () => {
				const food = Food()
				
				const angle = Math.random() * Math.PI * 2
				const radius2 = ( radius * 0.8 ) + Math.random() * radius * 0.4
				// const radius2 = radius
				food.position.x = position.x + Math.cos( angle ) * radius2
				food.position.y = position.y + Math.sin( angle ) * radius2
				
				world.addFood( food )
			} )
		}
	}
	
	self.reset = function ( hard ) {
		timer.cancelAlarms()
		
		// remove any existing replicators
		// TODO better way of removing replicators than killing them?
		world.replicators.slice().forEach( replicator => replicator.die() )
		
		// repopulate world from frozen specimens
		// shortly after first bloom
		cryo.forEach( ( specimen, specimenIndex ) => {
			timer.setAlarm( 3 + specimenIndex * 0.3, () => {
				const child = specimen.replicate( true )
				
				const angle = Math.random() * Math.PI * 2
				const radius2 = Math.random() * 3
				child.position.x = Math.cos( angle ) * radius2
				child.position.y = Math.sin( angle ) * radius2
				
				world.addReplicator( child )
			} )
		} )
		
		// remove any existing foods
		// TODO better way of removing foods than spoiling them?
		world.foods.slice().forEach( food => food.spoil() )
		
		world.predators.slice().forEach( predator => world.removePredator( predator ) )
		
		const alwaysBeBlooming = () => {
			// random point along edge of world
			const angle = Math.random() * Math.PI * 2
			const position = {}
			position.x = Math.cos( angle ) * ( self.designatedWidth / 2 )
			position.y = Math.sin( angle ) * ( self.designatedWidth / 2 )
			
			self.doBloom( { x: 0, y: 0 }, 180, 5 )
			
			timer.setAlarm( 30, alwaysBeBlooming )
		}
		
		timer.setAlarm( 0, alwaysBeBlooming )
		
		const addPredator = () => {
			const predator = Predator()
			
			// random point past edge of world
			const angle = Math.random() * Math.PI * 2
			predator.position.x = Math.cos( angle ) * self.designatedWidth
			predator.position.y = Math.sin( angle ) * self.designatedWidth
			
			world.addPredator( predator )
		}
		
		timer.setAlarm( 6, addPredator )
		
		console.log( 'Reset @', new Date() )
	}
	
	world.on( 'replicator-died', body => {
		cryo.push( body )
		if ( world.replicators.length === 0 ) self.reset()
	} )
	
	// TODO will we be needing t for anything?
	self.update = function ( dt, t ) {
		timer.update( dt )
		world.update( dt )
	}
	
	self.reset()
	
	return self
}
