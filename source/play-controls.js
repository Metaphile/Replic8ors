// TODO hot key for normal speed (1?)

import $ from '../third-party/jquery'
import html from './play-controls.html'
import GameLoop from './engine/game-loop'
import { formatElapsedTime } from './helpers'

export default function PlayControls( gameLoop, onToggleSuperFast ) {
	const $form = $( html )
	
	// prevent submit
	$form.submit( event => event.preventDefault() )
	
	const $pauseResume = $( '[name=pause-resume]', $form )
	$pauseResume.click( () => {
		// TODO toggle play/pause icon
		gameLoop.paused = !gameLoop.paused
	} )
	$( document ).keydown( event => {
		// spacebar
		if ( event.which === 32 ) {
			event.preventDefault()
			$pauseResume.click()
		}
	} )
	
	const $step = $( '[name=step]', $form )
	$step.click( () => {
		gameLoop.paused = true
		gameLoop.step()
	} )
	$( document ).keydown( event => {
		// right arrow key
		if ( event.which === 39 ) {
			event.preventDefault() // necessary?
			$step.click()
		}
	} )
	
	$( '[name=speed-normal]', $form ).click( () => {
		gameLoop.timescale = 1
		gameLoop.paused = false
	} )
	
	// TODO measure time and squeeze as many simulation ticks as possible into 1/60 sec
	// don't go too much over because it affects UI responsiveness
	$( '[name=speed-fast]', $form ).click( () => {
		gameLoop.timescale = 10
		gameLoop.paused = false
	} )
	
	$( '[name=info]', $form ).click( () => {
		$( '#info' ).fadeToggle()
	} )
	
	// prevent link clicks from dismissing info box
	$( '#info a' ).click( ( event ) => {
		event.stopPropagation();
	});
	
	$( '#info' ).click( () => {
		$( '#info' ).fadeOut()
	} )
	
	$( document ).keydown( event => {
		// 27 == escape
		if ( event.which === 27 ) {
			// toggle because it's convenient for development
			$( '#info' ).fadeToggle()
		}
	} )
	
	const $background = $( '[name=offline]', $form )
	const $background2 = $( '[name=offline2]', $form )
	$background2.click( () => {
		$background.click()
		
		if ( $background.is( ':checked' ) ) {
			// run simulation at "max" speed when going offline
			gameLoop.timescale = 60 // simulation ticks per requestAnimationFrame
			gameLoop.paused = false
			
			// disable playback controls when simulating offline
			// they work fine, but it's not clear when you're paused/etc.
			$( '[name=step]' ).prop( 'disabled', true )
			$( '[name=pause-resume]' ).prop( 'disabled', true )
			$( '[name^=speed-]' ).prop( 'disabled', true ) // name begins with "speed-"
			
			// notify
			onToggleSuperFast( false )
		} else {
			// run simulation at normal speed when going online
			$( '[name=speed-normal]', $form ).click()
			
			// re-enable playback controls
			$( '[name=step]' ).prop( 'disabled', false )
			$( '[name=pause-resume]' ).prop( 'disabled', false )
			$( '[name^=speed-]' ).prop( 'disabled', false )
			
			onToggleSuperFast( true )
		}
	} )
	
	// TODO I forgot about this...it doesn't seem to work?
	$( document ).keydown( event => {
		// B key
		if ( event.which === 66 ) {
			event.preventDefault()
			$background.click()
		}
	} )
	
	const elapsedSimTime = $( '[name=elapsed-sim-time]', $form )[ 0 ]
	GameLoop( () => {
		elapsedSimTime.value = formatElapsedTime( gameLoop.elapsed )
	},
	() => {},
	{ timestep: 1/60 } )
	
	return $form[ 0 ]
}
