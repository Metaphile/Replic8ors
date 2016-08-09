import FocusRing from './focus-ring'
import Vector2 from '../engine/vector-2'

export default function Hud( camera ) {
	const trackablesMarkers = []
	let selected
	let focusRing = FocusRing()
	
	return {
		track( trackable, marker ) {
			trackablesMarkers.push( { trackable, marker } )
		},
		
		untrack( trackable ) {
			const i = trackablesMarkers.findIndex( pair => pair.trackable === trackable )
			if ( i > -1 ) trackablesMarkers.splice( i, 1 )
		},
		
		select( trackable ) {
			if ( !selected ) {
				focusRing.moveTo( camera.toScreen( trackable.position ) )
				focusRing.doFocusEffect( trackable.radius * 10 )
			}
			
			focusRing.radius = trackable.radius
			selected = trackable
		},
		
		deselect() {
			if ( selected ) {
				// TODO animation
				selected = null
			}
		},
		
		update( dt ) {
			if ( selected ) {
				const p1 = camera.toScreen( selected.position )
				const p2 = focusRing.position
				
				p2.x += ( p1.x - p2.x ) * 17 * dt
				p2.y += ( p1.y - p2.y ) * 17 * dt
			}
			
			focusRing.update( dt )
		},
		
		draw( ctx ) {
			const viewBounds_world = camera.viewBounds( ctx.canvas )
			const viewCenter_world = camera.viewCenter( ctx.canvas )
			
			const padding = 24
			const zoom = camera.zoomLevel()
			
			for ( let { trackable, marker } of trackablesMarkers ) {
				const { position, radius } = trackable
				const trackablePosition_world = position
				
				// AABB collision
				const offscreen =
					position.x + radius < viewBounds_world.topLeft.x + padding / zoom ||
					position.y + radius < viewBounds_world.topLeft.y + padding / zoom ||
					position.x - radius > viewBounds_world.bottomRight.x - padding / zoom ||
					position.y - radius > viewBounds_world.bottomRight.y - padding / zoom
				
				if ( offscreen ) {
					const viewCenter_screen = camera.toScreen( viewCenter_world )
					const position_screen = camera.toScreen( position )
					
					// from trackable to view center
					const offset = Vector2.subtract( position_screen, viewCenter_screen, {} )
					const slope = offset.y / offset.x
					
					const markerPosition_screen = Vector2()
					
					const rw = ctx.canvas.width / 2 - padding
					const rh = ctx.canvas.height / 2 - padding
					
					// trackable is below
					if ( offset.y >= 0 ) {
						markerPosition_screen.y = rh
						markerPosition_screen.x = rh / slope
						
						if ( markerPosition_screen.x > rw ) {
							markerPosition_screen.x = rw
							markerPosition_screen.y = slope * rw
						} else if ( markerPosition_screen.x < -rw ) {
							markerPosition_screen.x = -rw
							markerPosition_screen.y = slope * -rw
						}
					// trackable is above
					} else {
						markerPosition_screen.y = -rh
						markerPosition_screen.x = -rh / slope
						
						if ( markerPosition_screen.x > rw ) {
							markerPosition_screen.x = rw
							markerPosition_screen.y = slope * rw
						} else if ( markerPosition_screen.x < -rw ) {
							markerPosition_screen.x = -rw
							markerPosition_screen.y = slope * -rw
						}
					}
					
					Vector2.add( markerPosition_screen, viewCenter_screen )
					
					marker.draw( ctx, markerPosition_screen, Vector2.angle( offset ), trackable === selected )
				}
			}
			
			if ( selected ) focusRing.draw( ctx, camera )
		},
	}
}
