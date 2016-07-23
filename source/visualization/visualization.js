import WorldView from './world-view'
import Camera from '../engine/camera'
import CameraOperator from './camera-operator'
import $ from '../../third-party/jquery'
// import Hud from './hud'

export default function Visualization( world ) {
	const self = {}
	
	const $container = $( '<div class="visualization-container"/>' )
	const worldCanvas = WorldCanvas()
	const hudCanvas = HudCanvas()
	$container.append( worldCanvas )
	$container.append( hudCanvas )
	
	$container.on( 'appended', () => $( worldCanvas ).trigger( 'appended' ) )
	// propagate event downward
	/* $container.on( 'appended', function () {
		$container.children().each( function () {
			// children shouldn't bubble
			$( this ).trigger( 'appended' )
		} )
	} ) */
	
	self.$element = $container
	
	const worldCtx = worldCanvas.getContext( '2d' )
	const worldCamera = Camera( worldCtx )
	worldCamera.pan( -400, -300 )
	const hudCtx = hudCanvas.getContext( '2d' )
	const hudCamera = Camera( hudCtx )
	
	const cameraOp = CameraOperator( worldCamera )
	
	const worldView = WorldView( world )
	
	// TODO scrolling quickly flips y-axis??
	$( worldCanvas ).on( 'mousewheel', function ( event ) {
		event.preventDefault()
		// worldCamera.zoom( event.originalEvent.wheelDelta / 2000, worldCamera.toWorld( event.offsetX, event.offsetY ) )
		cameraOp.smoothZoom( event.originalEvent.wheelDelta / 2000, worldCamera.toWorld( event.offsetX, event.offsetY ) )
	} )
	
	$( worldCanvas ).click( ( event ) => {
		// if ( cancelClick ) return;
		
		const clickPos_world = worldCamera.toWorld( event.offsetX, event.offsetY )
		
		let target
		target = worldView.getPredatorAt( clickPos_world )
		target = target || worldView.getReplicatorAt( clickPos_world )
		
		target ? cameraOp.follow( target ) : cameraOp.unfollow()
	} )
	
	// self.hud = Hud()
	
	self.update = function ( dt, dt2 ) {
		cameraOp.update( dt )
		worldView.update( dt, dt2 )
		// this.hud.update( dt, t )
	},
	
	self.draw = function () {
		worldCamera.prepareCanvas()
		worldView.draw( worldCamera, worldCamera.toWorld( mousePos_screen ) )
		// this.hud.draw( hudCtx )
	}
	
	// dragging
	{
		let isDragging = false, dragLast_screen
		
		const $canvas = $( worldCanvas )
		
		$canvas.mousedown( event => {
			isDragging = true
			dragLast_screen = { x: event.offsetX, y: event.offsetY }
		} )
		
		// TODO minimum delta?
		$( document ).on( 'mousemove', event => {
			if ( isDragging ) {
				const dragLast_world = worldCamera.toWorld( dragLast_screen )
				const dragNow_world  = worldCamera.toWorld( event.offsetX, event.offsetY )
				
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
	$( worldCanvas ).on( 'mousemove', event => {
		mousePos_screen.x = event.offsetX
		mousePos_screen.y = event.offsetY
	} )
	
	$( worldCanvas ).on( 'mouseout', () => {
		mousePos_screen.x = Infinity
		mousePos_screen.y = Infinity
	} )
	
	const mousePos_screen = {}
	
	$( worldCanvas ).trigger( 'mouseout' )
	
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

function HudCanvas() {
	const $canvas = $( '<canvas class="hud"/>' )
	
	// ...
	
	return $canvas[ 0 ]
}
