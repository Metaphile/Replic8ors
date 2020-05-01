import ReplicatorView from './replicator-view'
import FoodView from './food-view'
import * as assets from './world-assets'
import Vector2 from '../engine/vector-2'

export default function WorldView( world ) {
	const self = {}
	
	self.preyViews = []
	self.predatorViews = []
	self.foodViews = []
	
	// world event subscriptions
	const worldSubs = {}
	
	// const foreground = assets.Foreground()
	
	// prey
	
	worldSubs[ 'prey-replicated' ] = world.on( 'prey-replicated', ( parent, child ) => {
		const parentViewIndex = self.preyViews.findIndex( view => view.replicator === parent )
		const childView = ReplicatorView( child )
		// put child behind parent
		self.preyViews.splice( parentViewIndex, 0, childView )
	} )
	
	worldSubs[ 'prey-died' ] = world.on( 'prey-died', prey => {
		const view = self.preyViews.find( view => {
			return view.replicator === prey
		} )
		
		view.doDeathEffect().then( () => {
			const i = self.preyViews.indexOf( view )
			self.preyViews.splice( i, 1 )
		} )
	} )
	
	const addPreyView = prey => {
		// HACK added event fires after replicated event; check if view has already been added
		if ( !self.preyViews.find( view => view.replicator === prey ) ) {
			self.preyViews.push( ReplicatorView( prey ) )
		}
	}
	
	world.preys.forEach( addPreyView )
	worldSubs[ 'prey-added' ] = world.on( 'prey-added', addPreyView )
	
	// predators
	
	worldSubs[ 'predator-replicated' ] = world.on( 'predator-replicated', ( parent, child ) => {
		const parentViewIndex = self.predatorViews.findIndex( view => view.replicator === parent )
		const childView = ReplicatorView( child, {}, 'predator' )
		// put child behind parent
		self.predatorViews.splice( parentViewIndex, 0, childView )
	} )
	
	const addPredatorView = predator => {
		// HACK added event fires after replicated event; check if view has already been added
		if ( !self.predatorViews.find( view => view.replicator === predator ) ) {
			self.predatorViews.push( ReplicatorView( predator, {}, 'predator' ) )
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
	
	worldSubs[ 'food-eaten' ] = world.on( 'food-eaten', ( food, preys ) => {
		const foodView = self.foodViews.find( view => {
			return view.food === food
		} )
		
		// food view won't be found when food is null (as when force feeding)
		foodView && foodView.doEatenEffect().then( () => {
			const i = self.foodViews.indexOf( foodView )
			self.foodViews.splice( i, 1 )
		} )
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
	
	self.update = ( dt_real, dt_sim ) => {
		for ( const view of self.preyViews ) {
			view.update( dt_real, dt_sim )
		}
		
		for ( const view of self.predatorViews ) {
			view.update( dt_real, dt_sim )
		}
		
		for ( const view of self.foodViews ) {
			view.update( dt_real, dt_sim )
		}
		
		// foreground.update( dt_sim )
	}
	
	self.draw = ( ctx, camera, mousePos_world, detail = 1 ) => {
		ctx.savePartial( 'lineWidth', 'strokeStyle' )
		
		// show world radius / boundary / edge
		ctx.beginPath()
			// slightly larger than world radius for aesthetics
			ctx.arc( 0, 0, world.radius * 1.1, 0, Math.PI * 2 )
			ctx.strokeStyle = 'rgba( 255, 75, 0, 0.45 )' // HUD marker orange
			ctx.lineWidth = 3
			ctx.setLineDash( [ 10, 10 ] )
			ctx.stroke()
			ctx.setLineDash( [] )
		
		const viewBounds = camera.viewBounds( ctx.canvas )
		
		const fisheyeZoomThreshold = 1.8
		
		for ( const view of self.preyViews ) {
			// don't draw offscreen preys
			const p = view.replicator.position
			const r = view.replicator.radius + 16
			if ( p.x + r < viewBounds.topLeft.x || p.x - r > viewBounds.bottomRight.x || p.y + r < viewBounds.topLeft.y || p.y - r > viewBounds.bottomRight.y ) continue
			
			const mouseDistance = Vector2.distance( mousePos_world, view.replicator.position )
			if ( ( mouseDistance < view.replicator.radius && camera.zoomLevel() >= fisheyeZoomThreshold && !view.replicator.dead ) ) {
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
			if ( ( mouseDistance < view.replicator.radius && camera.zoomLevel() >= fisheyeZoomThreshold && !view.replicator.dead ) ) {
				view.drawWithFisheye( ctx, camera, mousePos_world, detail )
			} else {
				view.draw( ctx, camera, detail )
			}
		}
		
		for ( const view of self.foodViews ) view.draw( ctx )
		
		// foreground.draw( ctx, camera.viewCenter( ctx.canvas ) )
		
		ctx.restorePartial()
	}
	
	self.destroy = () => {
		for ( const sub of Object.values( worldSubs ) ) {
			sub.unsubscribe()
		}
	}
	
	return self
}
