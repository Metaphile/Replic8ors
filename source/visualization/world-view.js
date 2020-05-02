import ReplicatorView from './replicator-view'
import Vector2 from '../engine/vector-2'

export default function WorldView( world ) {
	const self = {}
	
	self.replicatorViews = []
	
	// track event subscriptions so we can unsubscribe on destroy
	const eventSubscriptions = []
	
	eventSubscriptions.push( world.on( 'replicator-replicated', ( parent, child ) => {
		const parentViewIndex = self.replicatorViews.findIndex( view => view.replicator === parent )
		const childView = ReplicatorView( child )
		// put child view behind parent view
		self.replicatorViews.splice( parentViewIndex, 0, childView )
	} ) )
	
	eventSubscriptions.push( world.on( 'replicator-died', replicator => {
		const view = self.replicatorViews.find( view => view.replicator === replicator )
		
		view.doDeathEffect().then( () => {
			const i = self.replicatorViews.indexOf( view )
			self.replicatorViews.splice( i, 1 )
		} )
	} ) )
	
	const addReplicatorView = replicator => {
		// when replicator replicates, world emits replicator-replicated event followed by replicator-added event
		// we add views for both events, but must not add two views for the same replicator
		if ( !self.replicatorViews.find( view => view.replicator === replicator ) ) {
			self.replicatorViews.push( ReplicatorView( replicator ) )
		}
	}
	
	// add views for existing replicators
	;[ ...world.reds, ...world.greens, ...world.blues ].forEach( addReplicatorView )
	// add views for future replicator
	eventSubscriptions.push( world.on( 'replicator-added', addReplicatorView ) )
	
	self.update = ( dt_real, dt_sim ) => {
		for ( const view of self.replicatorViews ) {
			view.update( dt_real, dt_sim )
		}
	}
	
	// aka boundary, edge
	self.drawWorldRadius = ( ctx ) => {
		ctx.savePartial( 'lineWidth', 'strokeStyle' )
		
		ctx.beginPath()
			// draw larger than actual radius for aesthetics
			ctx.arc( 0, 0, world.radius * 1.1, 0, Math.PI * 2 )
			ctx.strokeStyle = 'rgba( 255, 75, 0, 0.45 )' // HUD marker color
			ctx.lineWidth = 3
			ctx.setLineDash( [ 10, 10 ] )
			ctx.stroke()
			ctx.setLineDash( [] )
		
		ctx.restorePartial()
	}
	
	self.draw = ( ctx, camera, mousePos_world, detail = 1 ) => {
		self.drawWorldRadius( ctx )
		
		const viewBounds = camera.viewBounds( ctx.canvas )
		const fisheyeZoomThreshold = 1.8
		
		for ( const view of self.replicatorViews ) {
			// don't draw offscreen replicator
			const p = view.replicator.position
			const flipperLength = 16 // estimate
			const r = view.replicator.radius + flipperLength
			if ( p.x + r < viewBounds.topLeft.x || p.x - r > viewBounds.bottomRight.x || p.y + r < viewBounds.topLeft.y || p.y - r > viewBounds.bottomRight.y ) continue
			
			const mouseDistance = Vector2.distance( mousePos_world, view.replicator.position )
			if ( ( mouseDistance < view.replicator.radius && camera.zoomLevel() >= fisheyeZoomThreshold && !view.replicator.dead ) ) {
				view.drawWithFisheye( ctx, camera, mousePos_world, detail )
			} else {
				view.draw( ctx, camera, detail )
			}
		}
	}
	
	self.destroy = () => {
		for ( const sub of eventSubscriptions ) {
			sub.unsubscribe()
		}
		
		eventSubscriptions.length = 0
	}
	
	return self
}
