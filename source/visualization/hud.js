import FocusRing from './focus-ring'
import Vector2 from '../engine/vector-2'

export default function Hud( camera ) {
	const trackablesMarkers = []
	const focusRing = FocusRing()
	let selected
	
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
				focusRing.doFocusEffect( camera.toScreen( trackable.position ), trackable.radius * camera.zoomLevel() )
			}
			
			selected = trackable
		},
		
		deselect() {
			if ( selected ) {
				focusRing.doBlurEffect()
				selected = null
			}
		},
		
		update( dt ) {
			if ( selected ) {
				focusRing.moveTo( camera.toScreen( selected.position ) )
				focusRing.sizeTo( selected.radius * camera.zoomLevel() )
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
				// TODO http://stackoverflow.com/a/402010/40356
				// or maybe http://stackoverflow.com/a/1879223/40356
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
			
			focusRing.draw( ctx, camera )
		},
	}
}
