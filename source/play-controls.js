// TODO maybe use <kbd> tag and label to indicate keyboard shortcuts
// make clickable
// TODO ESC key to zoom out

import $ from '../third-party/jquery'

export default function PlayControls( gameLoop ) {
	const $form =
		$( '<form>' )
	
	$form.submit( event => event.preventDefault() )
	
	const $playPause =
		$( '<button name="play-pause">Play / Pause</button>' )
	
	// TODO fast-forward
	
	const $sloMo =
		$( '<button name="slo-mo">Slow</button>' )
	
	$sloMo.click( () => {
		gameLoop.timescale = 0.2
		gameLoop.paused = false
	} )
	
	const $normalSpeed =
		$( '<button name="normal-speed">Real time</button>' )
	
	$normalSpeed.click( () => {
		gameLoop.timescale = 1
		gameLoop.paused = false
	} )
	
	const $highSpeed =
		$( '<button name="high-speed">Fast</button>' )
	
	$highSpeed.click( () => {
		gameLoop.timescale = 10
		gameLoop.paused = false
	} )
	
	$playPause.click( () => {
		gameLoop.paused = !gameLoop.paused
	} )
	
	const $step =
		$( '<button name="step">Step</button>' )
	
	$step.click( () => {
		gameLoop.paused = true
		// TODO update play-pause icon
		gameLoop.step()
	} )
	
	$( document ).keydown( event => {
		switch ( event.which ) {
			case 32: // spacebar
				event.preventDefault()
				$playPause.click()
				break
			
			case 39: // right arrow
				event.preventDefault() // may be too much
				$step.click()
				break
		}
	} )
	
	$form.append( $playPause )
	$form.append( $sloMo )
	$form.append( $normalSpeed )
	$form.append( $highSpeed )
	$form.append( $step )
	
	return $form[ 0 ]
}
