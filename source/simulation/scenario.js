import RingBuffer from '../engine/ring-buffer'
import settings, { settingsEvents } from '../settings/settings'
import Replic8or from './replic8or'

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
				const predators = [ ...geneBank.predator, ...world.reds ]
				
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
				const preys = [ ...geneBank.prey, ...world.greens ]
				
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
			
			case 'blue':
				const blues = [ ...geneBank.blue, ...world.blues ]
				
				blues.forEach( blue => blue[ key ] = value )
				
				switch ( key ) {
					case 'potentialDecayRate':
						for ( const blue of blues ) {
							for ( const neuron of blue.brain.neurons ) {
								neuron.potentialDecayRate = value
							}
						}
						break
				}
				
				break
		}
	} )
	
	const geneBank = {}
	const numSpecimensPerReplicatorType = 32
	for ( const replicatorType of [ 'predator', 'prey', 'blue' ] ) {
		geneBank[ replicatorType ] = RingBuffer( numSpecimensPerReplicatorType )
	}
	
	self.balancePopulations = function () {
		const excessReds = world.reds.length - self.maxReds
		const neededReds = Math.min( self.minReds, self.maxReds ) - world.reds.length
		if ( excessReds > 0 ) {
			world.reds
				.slice()
				// sort oldest to youngest
				.sort( ( a, b ) => b.age - a.age )
				.slice( 0, excessReds )
				.forEach( replicator => replicator.energy = -Infinity )
		} else if ( neededReds > 0 ) {
			addNumReds( neededReds )
		}
		
		const excessGreens = world.greens.length - self.maxGreens
		const neededGreens = Math.min( self.minGreens, self.maxGreens ) - world.greens.length
		if ( excessGreens > 0 ) {
			world.greens
				.slice()
				// sort oldest to youngest
				.sort( ( a, b ) => b.age - a.age )
				.slice( 0, excessGreens )
				.forEach( replicator => replicator.energy = -Infinity )
		} else if ( neededGreens > 0 ) {
			addNumGreens( neededGreens )
		}
		
		const excessBlues = world.blues.length - self.maxBlues
		const neededBlues = Math.min( self.minBlues, self.maxBlues ) - world.blues.length
		if ( excessBlues > 0 ) {
			world.blues
				.slice()
				// sort oldest to youngest
				.sort( ( a, b ) => b.age - a.age )
				.slice( 0, excessBlues )
				.forEach( replicator => replicator.energy = -Infinity )
		} else if ( neededBlues > 0 ) {
			addNumBlues( neededBlues )
		}
	}
	
	function createPopulation( howMany, founders, copyMember, createMember ) {
		const population = []
		
		while ( howMany-- ) {
			const founder = founders.next()
			population.push( founder ? copyMember( founder ) : createMember() )
		}
		
		return population
	}
	
	const replicateReplicator = parent => {
		const child = parent.replicate( true )
		child.energy = settings[ child.type ].energy
		return child
	}
	
	const createReplicator = type => {
		const replicator = Replic8or( settings[ type ] ).replicate()
		replicator.energy = settings[ type ].energy
		replicator.ancestorWeights = replicator.getOwnWeights()
		return replicator
	}
	
	const numReplicatorTypes = 3
	const numSpokes = numReplicatorTypes * 3
	
	let blueSpokeIndex = 0
	function addNumBlues( howMany ) {
		const ownSpokeOffset = 0
		
		createPopulation( howMany, geneBank.blue, replicateReplicator, () => createReplicator( 'blue' ) ).forEach( blue => {
			const radiusScale = Math.pow( Math.random(), 1 / Math.PI )
			const radius = radiusScale * world.radius
			
			const tau = Math.PI * 2
			const minAngle = ( ( ownSpokeOffset + blueSpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) - ( tau / numSpokes / 2 )
			const maxAngle = ( ( ownSpokeOffset + blueSpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) + ( tau / numSpokes / 2 )
			const angle = minAngle + ( Math.random() * ( maxAngle - minAngle ) )
			
			blue.position.x = Math.cos( angle ) * radius
			blue.position.y = Math.sin( angle ) * radius
			
			world.addBlue( blue )
			
			blueSpokeIndex = ( blueSpokeIndex + numReplicatorTypes ) % numSpokes
		} )
	}
	
	let preySpokeIndex = 0
	function addNumGreens( howMany ) {
		const ownSpokeOffset = 1
		
		createPopulation( howMany, geneBank.prey, replicateReplicator, () => createReplicator( 'prey' ) ).forEach( prey => {
			const radiusScale = Math.pow( Math.random(), 1 / Math.PI )
			const radius = radiusScale * world.radius
			
			const tau = Math.PI * 2
			const minAngle = ( ( ownSpokeOffset + preySpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) - ( tau / numSpokes / 2 )
			const maxAngle = ( ( ownSpokeOffset + preySpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) + ( tau / numSpokes / 2 )
			const angle = minAngle + ( Math.random() * ( maxAngle - minAngle ) )
			
			prey.position.x = Math.cos( angle ) * radius
			prey.position.y = Math.sin( angle ) * radius
			
			world.addPrey( prey )
			
			preySpokeIndex = ( preySpokeIndex + numReplicatorTypes ) % numSpokes
		} )
	}
	
	let predatorSpokeIndex = 0
	function addNumReds( howMany ) {
		const ownSpokeOffset = 2
		
		createPopulation( howMany, geneBank.predator, replicateReplicator, () => createReplicator( 'predator' ) ).forEach( predator => {
			const radiusScale = Math.pow( Math.random(), 1 / Math.PI )
			const radius = radiusScale * world.radius
			
			const tau = Math.PI * 2
			const minAngle = ( ( ownSpokeOffset + predatorSpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) - ( tau / numSpokes / 2 )
			const maxAngle = ( ( ownSpokeOffset + predatorSpokeIndex ) * ( tau / numSpokes ) - ( radiusScale * Math.PI * 0.5 ) ) + ( tau / numSpokes / 2 )
			const angle = minAngle + ( Math.random() * ( maxAngle - minAngle ) )
			
			predator.position.x = Math.cos( angle ) * radius
			predator.position.y = Math.sin( angle ) * radius
			
			world.addPredator( predator )
			
			predatorSpokeIndex = ( predatorSpokeIndex + numReplicatorTypes ) % numSpokes
		} )
	}
	
	self.reset = function ( hard ) {
		world.reds.slice().forEach( predator => predator.die() )
		world.greens.slice().forEach( prey => prey.die() )
		world.blues.slice().forEach( blue => blue.die() )
	}
	
	world.on( 'replicator-replicated', parent => {
		// add exact copy of successful replicator to gene bank
		geneBank[ parent.type ].push( parent.replicate( true, 0 ) )
	} )
	
	self.update = function ( dt ) {
		world.update( dt )
		self.balancePopulations()
	}
	
	self.reset()
	
	return self
}
