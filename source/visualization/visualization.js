import WorldView from './world-view'
import Camera from '../engine/camera'
import CameraOperator from './camera-operator'
import $ from '../../third-party/jquery'
import Hud from './hud'

export default function Visualization( world ) {
	const self = {}
	
	// selected replicator or predator
	let selection
	
	const $container = $( '<div class="visualization-container"/>' )
	const canvas = WorldCanvas()
	$container.append( canvas )
	
	const hud = Hud()
	
	$container.on( 'appended', () => $( canvas ).trigger( 'appended' ) )
	
	self.$element = $container
	
	const camera = Camera( canvas.getContext( '2d' ) )
	camera.pan( -400, -300 )
	
	const cameraOp = CameraOperator( camera )
	
	const worldView = WorldView( world )
	
	// TODO scrolling quickly flips y-axis??
	$( canvas ).on( 'mousewheel', function ( event ) {
		event.preventDefault()
		cameraOp.smoothZoom( event.originalEvent.wheelDelta / 1600, camera.toWorld( event.offsetX, event.offsetY ) )
	} )
	
	$( canvas ).click( ( event ) => {
		// if ( cancelClick ) return;
		
		const clickPos_world = camera.toWorld( event.offsetX, event.offsetY )
		
		selection = worldView.getPredatorAt( clickPos_world )
		selection = selection || worldView.getReplicatorAt( clickPos_world )
		
		if ( selection ) {
			if ( !hud.focusRing ) {
				hud.activateFocusRing( selection.position )
			}
			cameraOp.follow( selection )
		} else {
			hud.deactivateFocusRing()
			cameraOp.unfollow()
		}
	} )
	
	self.update = function ( dt, dt2 ) {
		if ( selection ) {
			// cameraOp.panToward( selection.position, dt )
			const p1 = selection.position
			const p2 = hud.focusRing.position
			p2.x += ( p1.x - p2.x ) * 11 * dt
			p2.y += ( p1.y - p2.y ) * 11 * dt
			
			hud.focusRing.radius = selection.radius * 1.2
		}
		
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
	
	// dragging
	{
		let isDragging = false, dragLast_screen
		
		const $canvas = $( canvas )
		
		$canvas.mousedown( event => {
			isDragging = true
			dragLast_screen = { x: event.offsetX, y: event.offsetY }
		} )
		
		// TODO minimum delta?
		$( document ).on( 'mousemove', event => {
			if ( isDragging ) {
				const dragLast_world = camera.toWorld( dragLast_screen )
				const dragNow_world  = camera.toWorld( event.offsetX, event.offsetY )
				
				const dx_world = dragLast_world.x - dragNow_world.x
				const dy_world = dragLast_world.y - dragNow_world.y
				
				cameraOp.smoothPan( dx_world, dy_world )
				
				dragLast_screen.x = event.offsetX
				dragLast_screen.y = event.offsetY
			}
		} )
		
		$( document ).mouseup( event => { isDragging = false } )
	}
	
	// fisheye
	$( canvas ).on( 'mousemove', event => {
		mousePos_screen.x = event.offsetX
		mousePos_screen.y = event.offsetY
	} )
	
	$( canvas ).on( 'mouseout', () => {
		mousePos_screen.x = Infinity
		mousePos_screen.y = Infinity
	} )
	
	const mousePos_screen = {}
	
	$( canvas ).trigger( 'mouseout' )
	
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
