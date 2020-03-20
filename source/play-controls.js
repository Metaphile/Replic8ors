import $ from '../third-party/jquery'
import html from './play-controls.html'
import GameLoop from './engine/game-loop'
import { formatElapsedTime } from './helpers'

export default function PlayControls( gameLoop, onToggleTurbo ) {
	const $form = $( html )
	
	let turboEnabled = false
	
	// prevent submit
	$form.submit( event => event.preventDefault() )
	
	const $pauseResume = $( '[name=pause-resume]', $form )
	$pauseResume.click( function () {
		// jQuery processes events on disabled elements
		// https://stackoverflow.com/a/47801250/40356
		if ( this.disabled ) return
		
		// TODO toggle play/pause icon
		gameLoop.paused = !gameLoop.paused
	} )
	
	const $step = $( '[name=step]', $form )
	$step.click( function () {
		if ( this.disabled ) return
		
		gameLoop.paused = true
		gameLoop.step()
	} )
	
	const $speedNormal = $( '[name=speed-normal]', $form )
	$speedNormal.click( function () {
		if ( this.disabled ) return
		
		gameLoop.timescale = 1
		gameLoop.paused = false
	} )
	
	const $speedFast = $( '[name=speed-fast]', $form )
	$speedFast.click( function () {
		if ( this.disabled ) return
		
		gameLoop.timescale = 10
		gameLoop.paused = false
	} )
	
	$( '[name=info]', $form ).click( function () {
		$( '#info' ).fadeToggle()
	} )
	
	// prevent link clicks from dismissing info box
	$( '#info a' ).click( function ( event ) {
		event.stopPropagation();
	});
	
	$( '#info' ).click( function () {
		$( '#info' ).fadeOut()
	} )
	
	// controls that aren't compatible with turbo mode
	const $turboExcludes = $( [
		'[name=pause-resume]',
		'[name=step]',
		'[name=speed-normal]',
		'[name=speed-fast]',
	].join( ',' ), $form )
	
	const $speedTurbo = $( '[name=speed-turbo]', $form )
	$speedTurbo.click( function () {
		turboEnabled = !turboEnabled
		
		if ( turboEnabled ) {
			$turboExcludes.prop( 'disabled', true )
			gameLoop.timescale = 60
			gameLoop.paused = false
			onToggleTurbo( turboEnabled )
		} else {
			$turboExcludes.prop( 'disabled', false )
			$( '[name=speed-normal]', $form ).click()
			onToggleTurbo( turboEnabled )
		}
	} )
	
	// keyboard shortcuts
	
	const keys = {
		ESCAPE:       27,
		SPACEBAR:     32,
		RIGHT_ARROW:  39,
		NUM_1:        49,
		NUM_2:        50,
		NUM_9:        57,
	}
	
	$( document ).keydown( function ( event ) {
		switch ( event.which ) {
			case keys.ESCAPE:
				event.preventDefault()
				$( '#info' ).fadeToggle()
				break
			
			case keys.SPACEBAR:
				event.preventDefault()
				$pauseResume.click()
				break
			
			case keys.RIGHT_ARROW:
				event.preventDefault()
				$step.click()
				break
			
			case keys.NUM_1:
				event.preventDefault()
				$speedNormal.click()
				break
			
			case keys.NUM_2:
				event.preventDefault()
				$speedFast.click()
				break
			
			case keys.NUM_9:
				event.preventDefault()
				$speedTurbo.click()
				break
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
