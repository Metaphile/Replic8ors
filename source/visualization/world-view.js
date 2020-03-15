// not that kind of world view
// TODO pointIntersectsReplicator( point_world )
// returns topmost replicator so needs to be aware of draw order

import ReplicatorView from './replicator-view'
// import PredatorView from './predator-view'
import PredatorView from './replicator-view'
import FoodView from './food-view'
import * as assets from './world-assets'
import Vector2 from '../engine/vector-2'

export default function WorldView( world ) {
	const self = {}
	
	self.replicatorViews = []
	self.predatorViews = []
	self.foodViews = []
	
	// world event subscriptions
	const worldSubs = {}
	
	// const foreground = assets.Foreground()
	
	// replicators
	
	worldSubs[ 'replicator-replicated' ] = world.on( 'replicator-replicated', ( parent, child ) => {
		const parentViewIndex = self.replicatorViews.findIndex( view => view.replicator === parent )
		const childView = ReplicatorView( child )
		// put child behind parent
		self.replicatorViews.splice( parentViewIndex, 0, childView )
	} )
	
	worldSubs[ 'replicator-died' ] = world.on( 'replicator-died', replicator => {
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
	worldSubs[ 'replicator-added' ] = world.on( 'replicator-added', addReplicatorView )
	
	// predators
	
	worldSubs[ 'predator-replicated' ] = world.on( 'predator-replicated', ( parent, child ) => {
		const parentViewIndex = self.predatorViews.findIndex( view => view.replicator === parent )
		const childView = PredatorView( child, {}, 'predator' )
		// put child behind parent
		self.predatorViews.splice( parentViewIndex, 0, childView )
	} )
	
	const addPredatorView = predator => {
		// HACK added event fires after replicated event; check if view has already been added
		if ( !self.predatorViews.find( view => view.replicator === predator ) ) {
			self.predatorViews.push( PredatorView( predator, {}, 'predator' ) )
		}
	}
	
	world.predators.forEach( addPredatorView )
	worldSubs[ 'predator-added' ] = world.on( 'predator-added', addPredatorView )
	
	worldSubs[ 'predator-died' ] = world.on( 'predator-died', predator => {
		const view = self.predatorViews.find( view => {
			return view.replicator === predator
		} )
		
		view.doDeathEffect().then( () => {
			const i = self.predatorViews.indexOf( view )
			self.predatorViews.splice( i, 1 )
		} )
	} )
	
	// foods
	
	const addFoodView = food => {
		self.foodViews.push( FoodView( food ) )
	}
	
	world.foods.forEach( addFoodView )
	worldSubs[ 'food-added' ] = world.on( 'food-added', addFoodView )
	
	worldSubs[ 'food-eaten' ] = world.on( 'food-eaten', ( food, replicators ) => {
		const foodView = self.foodViews.find( view => {
			return view.food === food
		} )
		
		// food view won't be found when food is null (as when force feeding)
		foodView && foodView.doEatenEffect().then( () => {
			const i = self.foodViews.indexOf( foodView )
			self.foodViews.splice( i, 1 )
		} )
		
		for ( const replicator of replicators ) {
			const replicatorView = self.replicatorViews.find( view => {
				return view.replicator === replicator
			} )
			
			replicatorView.doEnergyUpEffect()
		}
	} )
	
	worldSubs[ 'predator-eating-prey' ] = world.on( 'predator-eating-prey', ( predator ) => {
		const predatorView = self.predatorViews.find( view => view.replicator === predator )
		
		// loop energy up effect while predator is eating
		// predator-eating-prey event fires once per tick
		if ( predatorView.effects.energyUps.length === 0 ) {
			predatorView.doEnergyUpEffect()
		}
	} )
	
	worldSubs[ 'food-spoiled' ] = world.on( 'food-spoiled', food => {
		const view = self.foodViews.find( view => {
			return view.food === food
		} )
		
		view.doSpoiledEffect().then( () => {
			const i = self.foodViews.indexOf( view )
			self.foodViews.splice( i, 1 )
		} )
	} )
	
	/* world.on( 'food-destroyed', ( food, predator ) => {
		const view = self.foodViews.find( view => {
			return view.food === food
		} )
		
		// TODO parameters for destroyed effect
		const force = { x: 0, y: 0 }
		
		view.doDestroyedEffect( food.position, force ).then( () => {
			const i = self.foodViews.indexOf( view )
			self.foodViews.splice( i, 1 )
		} )
	} ) */
	
	self.update = ( dt, dt2 ) => {
		for ( const view of self.replicatorViews ) {
			let dt3 = dt2
			while ( dt3 > 1/60 ) {
				view.update( 0, 1/60 )
				dt3 -= 1/60
			}
			view.update( dt, dt3 )
		}
		
		for ( const view of self.predatorViews ) {
			let dt3 = dt2
			while ( dt3 > 1/60 ) {
				view.update( 0, 1/60 )
				dt3 -= 1/60
			}
			view.update( dt, dt3 )
		}
		
		for ( const view of self.foodViews       ) view.update( dt, dt2 )
		
		// foreground.update( dt2 )
	}
	
	self.draw = ( ctx, camera, mousePos_world, detail = 1 ) => {
		// show world radius
		ctx.beginPath()
			// slightly larger than world radius for aesthetics
			ctx.arc( 0, 0, world.radius * 1.1, 0, Math.PI * 2 )
			ctx.strokeStyle = 'silver'
			ctx.lineWidth = 3
			ctx.setLineDash( [ 10, 10 ] )
			ctx.stroke()
			ctx.setLineDash( [] )
		
		const viewBounds = camera.viewBounds( ctx.canvas )
		
		for ( const view of self.foodViews ) view.draw( ctx )
		
		const fisheyeZoomThreshold = 0
		
		for ( const view of self.replicatorViews ) {
			// don't draw offscreen replicators
			const p = view.replicator.position
			const r = view.replicator.radius + 16
			if ( p.x + r < viewBounds.topLeft.x || p.x - r > viewBounds.bottomRight.x || p.y + r < viewBounds.topLeft.y || p.y - r > viewBounds.bottomRight.y ) continue
			
			const mouseDistance = Vector2.distance( mousePos_world, view.replicator.position )
			if ( mouseDistance < view.replicator.radius && camera.zoomLevel() > fisheyeZoomThreshold ) {
				view.drawWithFisheye( ctx, camera, mousePos_world, detail )
			} else {
				view.draw( ctx, camera, detail )
			}
		}
		
		for ( const view of self.predatorViews ) {
			// don't draw offscreen predators
			const p = view.replicator.position
			const r = view.replicator.radius + 16
			if ( p.x + r < viewBounds.topLeft.x || p.x - r > viewBounds.bottomRight.x || p.y + r < viewBounds.topLeft.y || p.y - r > viewBounds.bottomRight.y ) continue
			
			const mouseDistance = Vector2.distance( mousePos_world, view.replicator.position )
			if ( mouseDistance < view.replicator.radius && camera.zoomLevel() > fisheyeZoomThreshold ) {
				view.drawWithFisheye( ctx, camera, mousePos_world, detail )
			} else {
				view.draw( ctx, camera, detail )
			}
		}
		
		// foreground.draw( ctx, camera.viewCenter( ctx.canvas ) )
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
	
	self.destroy = () => {
		for ( const sub of Object.values( worldSubs ) ) {
			sub.unsubscribe()
		}
	}
	
	return self
}
