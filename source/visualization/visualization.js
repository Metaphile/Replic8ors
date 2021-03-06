import WorldView from './world-view'
import Camera from '../engine/camera'
import CameraOperator from './camera-operator'
import * as $ from 'jquery'
import Hud from './hud'
import HudMarker from './hud-marker'
import Vector2 from '../engine/vector-2'
import { CtxPartialStateStack, pointIsInCircle } from '../helpers'

export default function Visualization( world ) {
	const self = {}
	
	const $container = $( '<div class="visualization-container"/>' )
	
	const $canvas = $Canvas()
	const canvas = $canvas[0]
	const ctx = canvas.getContext( '2d' )
	CtxPartialStateStack( ctx )
	
	$container.append( $canvas )
	
	$container.on( 'appended', () => $canvas.trigger( 'appended' ) )
	
	self.$element = $container
	
	self.attached = false
	
	const camera = Camera()
	
	// set initial camera position and zoom level
	camera.pan( Vector2.invert( camera.viewCenter( canvas ) ) )
	camera.zoom( -0.2, camera.viewCenter( canvas ) )
	
	const dummyCameraOp = {
		smoothPan() {},
		smoothZoom() {},
		smoothZoomTo() {},
		follow() {},
		unfollow() {},
		update() {},
		offset: { x: 0, y: 0 },
	}
	let cameraOp = dummyCameraOp
	
	const dummyWorldView = {
		replicatorViews: [],
		update() {},
		draw() {},
		destroy() {},
	}
	let worldView = dummyWorldView
	
	const dummyHud = {
		track() {},
		untrack() {},
		select() {},
		deselect() {},
		update() {},
		draw() {},
	}
	let hud = dummyHud
	
	// panning
	{
		// mousedown followed by mousemove > threshold == drag
		
		// prevent scrolling while dragging on touchscreen devices
		$( 'body' ).on( 'touchmove', event => event.preventDefault() )
		
		let isDragging = false
		let dragLast_screen = null
		const dragThreshold = 4
		
		$canvas.on( 'mousedown', ( event ) => {
			$canvas.trigger( 'pointerdown', [ event.offsetX, event.offsetY ] )
		} )
		
		$canvas.on( 'touchstart', ( event ) => {
			if ( !event.originalEvent.touches[ 0 ] ) return
			
			const offsetX = event.originalEvent.touches[ 0 ].pageX - event.originalEvent.touches[ 0 ].target.offsetLeft
			const offsetY = event.originalEvent.touches[ 0 ].pageY - event.originalEvent.touches[ 0 ].target.offsetTop
			
			$canvas.trigger( 'pointerdown', [ offsetX, offsetY ] )
		} )
		
		$canvas.on( 'pointerdown', ( event, offsetX, offsetY ) => {
			isDragging = false
			dragLast_screen = { x: offsetX, y: offsetY }
		} )
		
		$canvas.on( 'mousemove', ( event ) => {
			$canvas.trigger( 'mypointermove', [ event.offsetX, event.offsetY ] )
		} )
		
		$canvas.on( 'touchmove', ( event ) => {
			if ( !event.originalEvent.touches[ 0 ] ) return
			
			const offsetX = event.originalEvent.touches[ 0 ].pageX - event.originalEvent.touches[ 0 ].target.offsetLeft
			const offsetY = event.originalEvent.touches[ 0 ].pageY - event.originalEvent.touches[ 0 ].target.offsetTop
			
			$canvas.trigger( 'mypointermove', [ offsetX, offsetY ] )
		} )
		
		// originally "pointermove" but that's now a standard event, oops
		// TODO look into pointer* events which consolidate mouse/touch/pen events
		$canvas.on( 'mypointermove', ( event, offsetX, offsetY ) => {
			if ( !isDragging && dragLast_screen ) {
				const mousePos_screen = { x: offsetX, y: offsetY }
				const distance = Vector2.distance( mousePos_screen, dragLast_screen )
				
				if ( distance > dragThreshold ) {
					isDragging = true
				}
			}
			
			if ( isDragging ) {
				// important! previous world coords are probably wrong now due to camera movement
				// always get fresh coords
				const dragLast_world = camera.toWorld( dragLast_screen )
				
				const dragNow_screen = { x: offsetX, y: offsetY }
				const dragNow_world  = camera.toWorld( dragNow_screen )
				
				const dragDelta_world = Vector2.subtract( dragLast_world, dragNow_world, {} )
				
				cameraOp.smoothPan( dragDelta_world )
				
				Vector2.set( dragLast_screen, dragNow_screen )
			}
		} )
		
		$canvas.on( 'touchend', () => {
			if ( !event.originalEvent.touches[ 0 ] ) return
			
			$canvas.trigger( 'mouseup' )
		} )
		
		$canvas.on( 'mouseup', () => {
			dragLast_screen = null
		} )
		
		$canvas.on( 'click', ( event ) => {
			// cancel click if drag before mouseup
			if ( isDragging ) {
				isDragging = false
				event.stopImmediatePropagation()
			}
		} )
		
		$canvas.on( 'mouseout', () => {
			isDragging = false
			dragLast_screen = null
		} )
	}
	
	// zooming
	$canvas.on( 'wheel', ( event ) => {
		event.preventDefault()
		const { deltaMode, deltaY, offsetX, offsetY } = event.originalEvent
		
		const deltaIsInPixels = deltaMode === 0
		const scrollFactor = deltaIsInPixels ? -800 : -14
		
		cameraOp.smoothZoom( deltaY / scrollFactor, camera.toWorld( offsetX, offsetY ) )
	} )
	
	// selection
	{
		// selected prey or predator
		let selection
		
		function selectReplicatorByView( replicatorView ) {
			replicatorView.selected = true
			cameraOp.follow( replicatorView.replicator )
			hud.select( replicatorView.replicator )
			selection = replicatorView.replicator
		}
		
		function deselectReplicatorByView( replicatorView ) {
			replicatorView.selected = false
			replicatorView.neuronViews.forEach( v => v.selected = false )
			
			if ( selection === replicatorView.replicator ) {
				cameraOp.unfollow()
				hud.deselect()
				selection = null
			}
		}
		
		$canvas.on( 'click', ( event ) => {
			const clickPos_world = camera.toWorld( event.offsetX, event.offsetY )
			
			// reverse z-order (topmost first)
			const replicatorViews = worldView.replicatorViews.slice().reverse()
			
			const clickedReplicatorView = replicatorViews
				// don't allow selecting replicators that are dead or spawning
				.filter( v => !v.replicator.dead && !v.effects.spawn )
				.find( v => pointIsInCircle( clickPos_world, v.replicator ) )
			
			if ( !clickedReplicatorView ) {
				// clicked outside of any replicator
				replicatorViews.forEach( v => deselectReplicatorByView( v ) )
				return
			}
			
			if ( selection && selection !== clickedReplicatorView.replicator ) {
				// clicked on a different replicator
				// select new replicator before deselecting old replicator
				// so focus ring animates
				
				const previouslySelectedReplicatorView = replicatorViews.find( v => v.replicator === selection )
				selectReplicatorByView( clickedReplicatorView )
				
				// view won't be found when previously selected replicator died during turbo mode
				if ( previouslySelectedReplicatorView ) {
					deselectReplicatorByView( previouslySelectedReplicatorView )
				}
			} else if ( !selection ) {
				selectReplicatorByView( clickedReplicatorView )
			}
			
			const clickedNeuronView = clickedReplicatorView.neuronViews.slice().reverse().find( v => pointIsInCircle( clickPos_world, v ) )
			
			if ( !clickedNeuronView ) {
				// clicked outside of any neuron
				clickedReplicatorView.neuronViews.forEach( v => v.selected = false )
				return
			}
			
			// enable neuron selection at or above beginFisheyeLod
			if ( camera.zoomLevel() >= 2.9 ) {
				clickedNeuronView.selected = !clickedNeuronView.selected
			}
		} )
		
		$canvas.on( 'dblclick', ( event ) => {
			if ( selection ) {
				const clickPos_world = camera.toWorld( event.offsetX, event.offsetY )
				const inspectZoomLevel = 7.7
				if ( camera.zoomLevel() < inspectZoomLevel ) {
					cameraOp.smoothZoomTo( inspectZoomLevel, clickPos_world )
				}
				cameraOp.follow( selection )
				
				event.preventDefault()
			} else {
				const clickPos_world = camera.toWorld( event.offsetX, event.offsetY )
				cameraOp.smoothZoom( -1, clickPos_world )
			}
		} )
		
		world.on( 'replicator-died', replicator => {
			const replicatorView = worldView.replicatorViews.find( v => v.replicator === replicator )
			
			// no views when running in turbo mode
			if ( !replicatorView ) {
				return
			}
			
			// essentially a no-op if view isn't currently selected
			deselectReplicatorByView( replicatorView )
			
			// don't show offscreen indicators for dead replicators
			hud.untrack( replicator )
		} )
	}
	
	const trackReplicator = ( replicator ) => {
		hud.track( replicator, HudMarker() )
	}
	
	world.on( 'replicator-added', trackReplicator )
	
	self.attach = () => {
		worldView = WorldView( world )
		
		cameraOp = CameraOperator( camera, canvas )
		// restore previous x/y position when reattaching
		Object.assign( cameraOp.offset, dummyCameraOp.offset )
		
		hud = Hud( camera )
		
		for ( const replicator of [ ...world.reds, ...world.greens, ...world.blues ] ) {
			trackReplicator( replicator )
		}
		
		self.attached = true
		
		self.$element.removeClass( 'detached' )
	},
	
	self.detach = () => {
		worldView.destroy()
		worldView = dummyWorldView
		
		// capture camera x/y position before destroying
		// to restore when reattaching
		// TODO camera object itself knows offset but doesn't expose it
		cameraOp.unfollow()
		Object.assign( dummyCameraOp.offset, cameraOp.offset )
		cameraOp = dummyCameraOp
		
		hud = dummyHud
		
		self.attached = false
		
		self.$element.addClass( 'detached' )
	},
	
	self.update = ( dt_real, dt_sim ) => {
		cameraOp.update( dt_real, dt_sim )
		worldView.update( dt_real, dt_sim )
		hud.update( dt_real )
	},
	
	self.draw = () => {
		canvas.width = canvas.width
		
		camera.applyView( ctx )
		worldView.draw( ctx, camera, camera.toWorld( mousePos_screen ), camera.zoomLevel() )
		
		// HUD expects untransformed canvas
		ctx.setTransform( 1, 0, 0, 1, 0, 0 )
		hud.draw( ctx )
	}
	
	// fisheye
	
	const mousePos_screen = { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER }
	
	$canvas.on( 'mousemove', event => {
		mousePos_screen.x = event.offsetX
		mousePos_screen.y = event.offsetY
	} )
	
	$canvas.on( 'mouseout', () => {
		mousePos_screen.x = Number.MAX_SAFE_INTEGER
		mousePos_screen.y = Number.MAX_SAFE_INTEGER
	} )
	
	self.attach()
	
	return self
}

function $Canvas() {
	const $canvas = $( '<canvas class="world"/>' )
	
	function sizeToParent() {
		const $parent = $canvas.parent()
		
		$canvas.attr( 'width',  $parent.width() )
		// TODO actual control bar height is zero at first
		// canvas isn't sized properly until first window resize
		const controlBarHeight = 43
		$canvas.attr( 'height', $parent.height() - controlBarHeight )
	}
	
	$( window ).resize( sizeToParent )
	
	// custom event; must be triggered manually :\
	$canvas.on( 'appended', () => {
		sizeToParent()
		// don't bubble
		return false
	} )
	
	return $canvas
}
