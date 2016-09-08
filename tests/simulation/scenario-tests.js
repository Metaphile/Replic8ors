import Scenario from '../../source/simulation/scenario'
import World from '../../source/simulation/world'
import Food from '../../source/simulation/food'

xdescribe( 'scenario', () => {
	it( 'adds replicators to the world', () => {
		const world = World()
		const scenario = Scenario( world, { numReplicators: 3 } )
		expect( world.replicators.length ).toBe( 3 )
	} )
	
	describe( 'when the last replicator dies', () => {
		it( 'removes leftover food', () => {
			const world = World()
			const scenario = Scenario( world, { numReplicators: 1 } )
			
			world.addFood( Food() )
			world.addFood( Food() )
			expect( world.foods.length ).toBe( 2 )
			
			world.replicators[ 0 ].die()
			expect( world.foods.length ).toBe( 0 )
		} )
		
		it( 'adds more replicators', () => {
			const world = World()
			const scenario = Scenario( world, { numReplicators: 3 } )
			
			world.replicators[ 0 ].die()
			expect( world.replicators.length ).toBe( 2 )
			
			world.replicators[ 0 ].die() // 1 left
			world.replicators[ 0 ].die() // 0 left
			expect( world.replicators.length ).toBe( 3 )
		} )
	} )
} )
