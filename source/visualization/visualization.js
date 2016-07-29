import WorldView from './world-view'
import Camera from '../engine/camera'
import CameraOperator from './camera-operator'
import $ from '../../third-party/jquery'
import Hud from './hud'
import Vector2 from '../engine/vector-2'

export default function Visualization( world ) {
	const self = {}
	
	// selected replicator or predator
	let selection
	
	// TODO -> replicator-removed
	world.on( 'replicator-died predator-removed', entity => {
		if ( selection === entity ) {
			cameraOp.unfollow()
			hud.unfocus()
		}
	} )
	
	const $container = $( '<div class="visualization-container"/>' )
	const $canvas = $( WorldCanvas() )
	$container.append( $canvas )
	
	const hud = Hud()
	
	$container.on( 'appended', () => $canvas.trigger( 'appended' ) )
	
	self.$element = $container
	
	const camera = Camera( $canvas[0].getContext( '2d' ) )
	camera.pan( -400, -300 )
	
	const cameraOp = CameraOperator( camera )
	
	const worldView = WorldView( world )
	
	// dragging
	{
		// mousedown followed by mousemove > threshold == drag
		
		let isDragging = false
		let dragLast_screen = null
		const dragThreshold = 2
		
		$canvas.on( 'mousedown', () => {
			isDragging = false
			dragLast_screen = { x: event.offsetX, y: event.offsetY }
		} )
		
		$canvas.on( 'mousemove', ( event ) => {
			if ( dragLast_screen ) {
				const mousePos_screen = { x: event.offsetX, y: event.offsetY }
				const distance = Vector2.distance( mousePos_screen, dragLast_screen )
				
				if ( distance > dragThreshold ) {
					isDragging = true
				}
			}
		} )
		
		$canvas.on( 'mousemove', ( event ) => {
			if ( isDragging ) {
				// important! previous world coords are probably wrong now;
				// always get fresh coords
				const dragLast_world = camera.toWorld( dragLast_screen )
				
				const dragNow_screen = { x: event.offsetX, y: event.offsetY }
				const dragNow_world  = camera.toWorld( dragNow_screen )
				
				const dragDelta_world = Vector2.subtract( dragLast_world, dragNow_world, {} )
				
				cameraOp.smoothPan( dragDelta_world )
				
				Vector2.set( dragLast_screen, dragNow_screen )
			}
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
	}
	
	// TODO scrolling quickly flips y-axis??
	$canvas.on( 'mousewheel', function ( event ) {
		event.preventDefault()
		cameraOp.smoothZoom( event.originalEvent.wheelDelta / 1600, camera.toWorld( event.offsetX, event.offsetY ) )
	} )
	
	$canvas.click( ( event ) => {
		const clickPos_world = camera.toWorld( event.offsetX, event.offsetY )
		
		selection = worldView.getPredatorAt( clickPos_world )
		selection = selection || worldView.getReplicatorAt( clickPos_world )
		
		if ( selection ) {
			cameraOp.follow( selection )
			hud.focusOn( selection )
		} else {
			cameraOp.unfollow()
			hud.unfocus()
		}
	} )
	
	self.update = function ( dt, dt2 ) {
		cameraOp.update( dt )
		worldView.update( dt, dt2 )
		hud.update( dt )
	},
	
	self.draw = function () {
		camera.prepareCanvas()
		
		const detail = camera.getZoomLevel() / 18
		worldView.draw( camera, camera.toWorld( mousePos_screen ), detail )
		hud.draw( camera )
	}
	
	// fisheye
	$canvas.on( 'mousemove', event => {
		mousePos_screen.x = event.offsetX
		mousePos_screen.y = event.offsetY
	} )
	
	$canvas.on( 'mouseout', () => {
		mousePos_screen.x = Infinity
		mousePos_screen.y = Infinity
	} )
	
	const mousePos_screen = {}
	
	$canvas.trigger( 'mouseout' )
	
	return self
}

function WorldCanvas() {
	const $canvas = $( '<canvas class="world"/>' )
	
	function sizeToParent() {
		const $parent = $canvas.parent()
		
		$canvas.attr( 'width',  $parent.width() )
		$canvas.attr( 'height', $parent.height() )
	}
	
	$( window ).resize( sizeToParent )
	
	// custom event; must be triggered manually :\
	$canvas.on( 'appended', () => {
		sizeToParent()
		// don't bubble
		return false
	} )
	
	return $canvas[ 0 ]
}
