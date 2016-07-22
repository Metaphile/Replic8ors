import Visualization from '../../source/visualization/visualization'
import World from '../../source/simulation/world'
import Replic8or from '../../source/simulation/replic8or'
import Food from '../../source/simulation/food'
import $ from '../../third-party/jquery'

xdescribe( 'visualization', () => {
	it( 'creates views for new/existing replicators', () => {
		const world = World()
		world.addReplicator( Replic8or() )
		world.addReplicator( Replic8or() )
		
		const visualization = Visualization( world )
		expect( visualization.replicatorViews.length ).toBe( 2 )
		
		world.addReplicator( Replic8or() )
		expect( visualization.replicatorViews.length ).toBe( 3 )
	} )
	
	it( 'creates views for new/existing foods', () => {
		const world = World()
		world.addFood( Food() )
		world.addFood( Food() )
		
		const visualization = Visualization( world )
		expect( visualization.foodViews.length ).toBe( 2 )
		
		world.addFood( Food() )
		expect( visualization.foodViews.length ).toBe( 3 )
	} )
	
	it( 'removes food views when appropriate', () => {
		// ???
	} )
	
	xit( 'DOM element fills parent', () => {
		const visualization = Visualization( World() )
		
		const $parent = $( '<div/>' )
		$parent.width( 1024 )
		$parent.height( 768 )
		
		console.log( visualization )
		$parent.append( visualization.$element )
		visualization.$element.trigger( 'appended' )
		
		expect( visualization.$element.width() ).toBe( 1024 )
	} )
	
	xit( 'centers camera initially', () => {
		// ...
	} )
	
	xit( 'removes food views when foods spoil', () => {
		const world = World()
		
		const food = Food()
		world.addFood( food )
		
		const vis = Visualization( world )
		
		food.spoil()
		vis.update( 10, 10 )
		
		expect( vis.foodViews.length ).toBe( 0 )
	} )
} )
