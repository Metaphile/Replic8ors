import Food from './food'
import Timer from '../engine/timer'
import Replic8or from './replic8or'
// import Predator from './predator'
import Predator from './replic8or'
import RingBuffer from '../engine/ring-buffer'

const defaultOpts = {
	designatedWidth:  580,
	designatedHeight: 480,
	numReplicators: 11,
	numPredators: 7,
}

export default function Scenario( world, opts = {} ) {
	const self = {}
	Object.assign( self, defaultOpts, opts )
	
	// archive
	const replicatorCryo = RingBuffer( self.numReplicators )
	const predatorCryo = RingBuffer( self.numPredators )
	// const seed = Replic8or()
	// for ( let n = self.numReplicators; n > 0; n-- ) replicatorCryo.push( seed.replicate() )
	for ( let n = self.numReplicators; n > 0; n-- ) replicatorCryo.push( Replic8or() )
	for ( let n = self.numPredators; n > 0; n-- ) predatorCryo.push( Predator() )
	
	const timer = Timer()
	
	self.doBloom = function ( position, radius, density ) {
		for ( ; density > 0; density-- ) {
			// spawn foods one after another
			timer.setAlarm( density * 0.3, () => {
				const food = Food()
				
				const angle = Math.random() * Math.PI * 2
				// const radius2 = ( radius * 0.8 ) + Math.random() * radius * 0.4
				const radius2 = Math.pow( Math.random(), 1/4) * radius
				food.position.x = position.x + Math.cos( angle ) * radius2
				food.position.y = position.y + Math.sin( angle ) * radius2
				
				world.addFood( food )
			} )
		}
	}
	
	self.reset = function ( hard ) {
		timer.cancelAlarms()
		
		// remove any existing replicators, predators
		// TODO better way of removing replicators than killing them?
		world.replicators.slice().forEach( replicator => replicator.die() )
		world.predators.slice().forEach( replicator => replicator.die() )
		
		// repopulate world from frozen specimens
		// shortly after first bloom
		
		// ensure some genetic variation even if no members manage to reproduce
		for ( let i = 0; i < replicatorCryo.length; i++ ) {
			replicatorCryo[ i ] = replicatorCryo[ i ].replicate( true )
		}
		
		replicatorCryo.forEach( ( specimen, specimenIndex ) => {
			timer.setAlarm( 3 + specimenIndex * 0.3, () => {
				const child = specimen.replicate( true )
				
				const angle = Math.random() * Math.PI * 2
				const radius2 = 160 + Math.random() * ( 220 - 160 )
				child.position.x = Math.cos( angle ) * radius2
				child.position.y = Math.sin( angle ) * radius2
				
				world.addReplicator( child )
			} )
		} )
		
		// ensure some genetic variation even if no members manage to reproduce
		for ( let i = 0; i < predatorCryo.length; i++ ) {
			predatorCryo[ i ] = predatorCryo[ i ].replicate( true )
		}
		
		predatorCryo.forEach( ( specimen, specimenIndex ) => {
			timer.setAlarm( 3 + specimenIndex * 0.3, () => {
				const child = specimen.replicate( true )
				
				const angle = Math.random() * Math.PI * 2
				const radius2 = Math.random() * 3
				child.position.x = Math.cos( angle ) * radius2
				child.position.y = Math.sin( angle ) * radius2
				
				world.addPredator( child )
			} )
		} )
		
		// remove any existing foods
		// TODO better way of removing foods than spoiling them?
		world.foods.slice().forEach( food => food.spoil() )
		
		const alwaysBeBlooming = () => {
			// random point along edge of world
			const angle = Math.random() * Math.PI * 2
			const position = {}
			position.x = Math.cos( angle ) * ( self.designatedWidth / 2 )
			position.y = Math.sin( angle ) * ( self.designatedWidth / 2 )
			
			self.doBloom( { x: 0, y: 0 }, 400, 11 )
			
			timer.setAlarm( 20, alwaysBeBlooming )
		}
		
		timer.setAlarm( 0, alwaysBeBlooming )
		
		console.log( 'Reset @', new Date() )
	}
	
	world.on( 'replicator-replicated', ( parent, child ) => {
		replicatorCryo.push( parent )
	} )
	
	world.on( 'predator-replicated', ( parent, child ) => {
		predatorCryo.push( parent )
	} )
	
	// TODO this is causing a weird bug where more than the expected number of predatores spawn after the first round
	// world.on( 'replicator-died', parent => {
	// 	if ( world.replicators.length === 0 ) self.reset()
	// } )
	
	world.on( 'predator-died', parent => {
		if ( world.predators.length === 0 ) self.reset()
	} )
	
	// TODO will we be needing t for anything?
	self.update = function ( dt, t ) {
		timer.update( dt )
		world.update( dt )
	}
	
	self.reset()
	
	return self
}
