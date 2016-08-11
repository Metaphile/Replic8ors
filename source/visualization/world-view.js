// not that kind of world view
// TODO pointIntersectsReplicator( point_world )
// returns topmost replicator so needs to be aware of draw order

import ReplicatorView from './replicator-view'
import PredatorView from './predator-view'
import FoodView from './food-view'
import * as assets from './world-assets'
import Vector2 from '../engine/vector-2'

export default function WorldView( world ) {
	const self = {}
	
	self.replicatorViews = []
	self.predatorViews = []
	self.foodViews = []
	
	const foreground = assets.Foreground()
	
	// topmost replicator view under pointer
	let hoverTarget = null
	
	// replicators
	
	world.on( 'replicator-replicated', ( parent, child ) => {
		const parentViewIndex = self.replicatorViews.findIndex( view => view.replicator === parent )
		const childView = ReplicatorView( child )
		// put child behind parent
		self.replicatorViews.splice( parentViewIndex, 0, childView )
	} )
	
	world.on( 'replicator-died', replicator => {
		const view = self.replicatorViews.find( view => {
			return view.replicator === replicator
		} )
		
		view.doDeathEffect().then( () => {
			const i = self.replicatorViews.indexOf( view )
			self.replicatorViews.splice( i, 1 )
		} )
	} )
	
	const addReplicatorView = replicator => {
		// HACK added event fires after replicated event; check if view has already been added
		if ( !self.replicatorViews.find( view => view.replicator === replicator ) ) {
			self.replicatorViews.push( ReplicatorView( replicator ) )
		}
	}
	
	world.replicators.forEach( addReplicatorView )
	world.on( 'replicator-added', addReplicatorView )
	
	// predators
	
	const addPredatorView = predator => {
		self.predatorViews.push( PredatorView( predator ) )
	}
	
	world.predators.forEach( addPredatorView )
	world.on( 'predator-added', addPredatorView )
	
	world.on( 'predator-removed', predator => {
		const i = self.predatorViews.findIndex( view => view.predator === predator )
		self.predatorViews.splice( i, 1 )
	} )
	
	// foods
	
	const addFoodView = food => {
		self.foodViews.push( FoodView( food ) )
	}
	
	world.foods.forEach( addFoodView )
	world.on( 'food-added', addFoodView )
	
	world.on( 'food-eaten', ( food, replicators ) => {
		const foodView = self.foodViews.find( view => {
			return view.food === food
		} )
		
		foodView.doEatenEffect().then( () => {
			const i = self.foodViews.indexOf( foodView )
			self.foodViews.splice( i, 1 )
		} )
		
		for ( let replicator of replicators ) {
			const replicatorView = self.replicatorViews.find( view => {
				return view.replicator === replicator
			} )
			
			replicatorView.doEnergyUpEffect()
		}
	} )
	
	world.on( 'food-spoiled', food => {
		const view = self.foodViews.find( view => {
			return view.food === food
		} )
		
		view.doSpoiledEffect().then( () => {
			const i = self.foodViews.indexOf( view )
			self.foodViews.splice( i, 1 )
		} )
	} )
	
	world.on( 'food-destroyed', ( food, predator ) => {
		const view = self.foodViews.find( view => {
			return view.food === food
		} )
		
		// TODO parameters for destroyed effect
		const force = { x: 0, y: 0 }
		
		view.doDestroyedEffect( food.position, force ).then( () => {
			const i = self.foodViews.indexOf( view )
			self.foodViews.splice( i, 1 )
		} )
	} )
	
	self.update = ( dt, dt2, mousePos_world ) => {
		hoverTarget = null
		
		// test for hover targets from top to bottom; topmost target gets precedence
		for ( let i = self.replicatorViews.length - 1; i >= 0; i-- ) {
			const view = self.replicatorViews[i]
			
			if ( !hoverTarget ) {
				const replicator = view.replicator
				const offset = Vector2.subtract( mousePos_world, replicator.position, {} )
				const distance = Vector2.getLength( offset )
				
				if ( distance < replicator.radius ) {
					hoverTarget = view
				}
			}
			
			view.update( dt, dt2 )
		}
		
		for ( let view of self.predatorViews   ) view.update( dt, dt2 )
		for ( let view of self.foodViews       ) view.update( dt, dt2 )
	}
	
	self.draw = ( ctx, camera, mousePos_world, detail = 1 ) => {
		for ( let view of self.replicatorViews ) {
			if ( view === hoverTarget ) {
				view.drawWithFisheye( ctx, mousePos_world, detail )
			} else {
				view.draw( ctx, detail )
			}
		}
		
		for ( let view of self.predatorViews   ) view.draw( ctx )
		for ( let view of self.foodViews       ) view.draw( ctx )
		
		foreground.draw( ctx, camera.viewCenter( ctx.canvas ) )
	}
	
	const pointInCircle = ( point, center, radius ) => {
		const distance = Vector2.getLength( Vector2.subtract( center, point, {} ) ) - radius
		return distance < 0
	}
	
	// return topmost replicator view at point or undefined
	self.getReplicatorAt = ( point_world ) => {
		return world.replicators.slice().reverse().find( replicator => {
			return pointInCircle( point_world, replicator.position, replicator.radius )
		} )
	}
	
	self.getPredatorAt = ( point_world ) => {
		return world.predators.slice().reverse().find( predator => {
			return pointInCircle( point_world, predator.position, predator.radius )
		} )
	}
	
	return self
}
