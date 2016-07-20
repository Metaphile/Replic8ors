import ReplicatorView from './replicator-view'
import FoodView from './food-view'
import PredatorView from './predator-view'
import Camera from '../engine/camera'
import CameraOperator from './camera-operator'
import $ from '../../third-party/jquery'
import * as worldAssets from './world-assets'
// import Hud from './hud'
import Vector2 from '../engine/vector-2'

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
	
	world.on( 'replicator-died', replicator => {
		const view = self.replicatorViews.find( view => view.replicator === replicator )
		const i = self.replicatorViews.indexOf( view )
		self.replicatorViews.splice( i, 1 )
	} )
	
	world.on( 'predator-removed', predator => {
		const view = self.predatorViews.find( view => view.predator === predator )
		const i = self.predatorViews.indexOf( view )
		self.predatorViews.splice( i, 1 )
	} )
	
	world.on( 'food-spoiled', food => {
		const view = self.foodViews.find( view => view.food === food )
		view.doSpoiledEffect().then( () => {
			self.removeFoodView( view )
		} )
	} )
	
	world.on( 'food-eaten', ( food, recipients ) => {
		for ( let replicator of recipients ) {
			const replicatorView = self.replicatorViews.find( view => {
				return view.replicator === replicator
			} )
			
			replicatorView.doEnergyUpEffect()
		}
		
		const view = self.foodViews.find( view => view.food === food )
		// view.doCrumbsEffect().then( () => {
		// 	self.removeFoodView( view )
		// } )
		self.removeFoodView( view )
	} )
	
	world.on( 'food-destroyed', ( food, direction ) => {
		const view = self.foodViews.find( view => view.food === food )
		view.doCrumbsEffect( 3, direction, 60 ).then( () => {
			self.removeFoodView( view )
		} )
	} )
	
	self.world = world
	
	self.replicatorViews = []
	self.foodViews = []
	self.predatorViews = []
	
	// TODO scrolling quickly flips y-axis??
	$( worldCanvas ).on( 'mousewheel', function ( event ) {
		event.preventDefault()
		// worldCamera.zoom( event.originalEvent.wheelDelta / 2000, worldCamera.toWorld( event.offsetX, event.offsetY ) )
		cameraOp.smoothZoom( event.originalEvent.wheelDelta / 2000, worldCamera.toWorld( event.offsetX, event.offsetY ) )
	} )
	
	$( worldCanvas ).click( ( event ) => {
		// if ( cancelClick ) return;
		
		const clickPos = worldCamera.toWorld( event.offsetX, event.offsetY )
		
		const pointInCircle = ( point, center, radius ) => {
			const distance = Vector2.getLength( Vector2.subtract( center, point, {} ) ) - radius
			return distance < 0
		}
		
		let target
		
		target = world.predators.slice().reverse().find( predator =>
		 	pointInCircle( clickPos, predator.position, predator.radius ) )
		
		target = target || world.replicators.slice().reverse().find( replicator =>
			pointInCircle( clickPos, replicator.position, replicator.radius ) )
		
		target ? cameraOp.follow( target ) : cameraOp.unfollow()
	} )
	
	// self.hud = Hud()
	
	self.addReplicatorView = function ( view ) {
		this.replicatorViews.push( view )
	}
	
	self.addFoodView = function ( view ) {
		this.foodViews.push( view )
	}
	
	self.addPredatorView = ( view ) => {
		self.predatorViews.push( view )
	}
	
	self.removeFoodView = function ( view ) {
		const index = self.foodViews.indexOf( view )
		self.foodViews.splice( index, 1 )
	}
	
	self.removePredatorView = ( view ) => {
		const index = self.predatorViews.indexOf( view )
		self.predatorViews.splice( index, 1 )
	}
	
	self.update = function ( dt, dt2 ) {
		for ( let replicatorView of this.replicatorViews ) {
			replicatorView.update( dt, dt2 )
		}
		
		for ( let view of this.foodViews ) view.update( dt, dt2 )
		for ( let view of this.predatorViews ) view.update( dt, dt2 )
		
		// this.hud.update( dt, t )
		cameraOp.update( dt )
	},
	
	self.draw = function () {
		worldCamera.prepareCanvas()
		
		const detail = Math.min( worldCamera.getZoomLevel() / 3, 1 )
		
		for ( let view of this.replicatorViews ) view.draw( worldCtx, detail )
		for ( let view of this.predatorViews   ) view.draw( worldCtx )
		for ( let view of this.foodViews       ) view.draw( worldCtx )
		
		// drawForeground( worldCtx )
		
		// this.hud.draw( hudCtx )
	}
	
	const drawForeground = ( ctx ) => {
		const center = worldCamera.centerOfView()
		const scale = worldCamera.getZoomLevel()
		Vector2.scale( center, -1.3 )
		const width  = 1024
		const height = 1024
		
		ctx.drawImage( worldAssets.foregroundTile, center.x - width/2, center.y - width/2, width, height )
	}
	
	{
		world.on( 'replicator-replicated', ( parent, child ) => {
			const parentViewIndex = self.replicatorViews.findIndex( view => view.replicator === parent )
			const childView = ReplicatorView( child )
			// position child just behind parent
			self.replicatorViews.splice( parentViewIndex, 0, childView )
		} )
	}
	
	{
		const addView = replicator => {
			if ( !self.replicatorViews.find( view => view.replicator === replicator ) ) {
				self.addReplicatorView( ReplicatorView( replicator ) )
			}
		}
		world.replicators.forEach( addView )
		world.on( 'replicator-added', addView )
	}
	
	{
		const addView = food => self.addFoodView( FoodView( food ) )
		world.foods.forEach( addView )
		world.on( 'food-added', addView )
	}
	
	{
		const addView = predator => self.addPredatorView( PredatorView( predator ) )
		world.predators.forEach( addView )
		world.on( 'predator-added', addView )
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
