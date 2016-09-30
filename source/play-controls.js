const fs = require( 'fs' )
import $ from '../third-party/jquery'

const html = fs.readFileSync( __dirname + '/play-controls.html', 'utf8' )

export default function PlayControls( gameLoop ) {
	const $form = $( html )
	
	// prevent submit
	$form.submit( event => event.preventDefault() )
	
	const $pauseResume = $( '[name=pause-resume]', $form )
	$pauseResume.click( () => {
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
	
	$( '[name=speed-slow]', $form ).click( () => {
		gameLoop.timescale = 0.2
		gameLoop.paused = false
	} )
	
	$( '[name=speed-normal]', $form ).click( () => {
		gameLoop.timescale = 1
		gameLoop.paused = false
	} )
	
	$( '[name=speed-fast]', $form ).click( () => {
		gameLoop.timescale = 10
		gameLoop.paused = false
	} )
	
	return $form[ 0 ]
}
