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
	
	const $step =
		$( '<button name="step">Step</button>' )
	
	// TODO fast-forward
	
	// TODO get rid of this thing
	// use keys/buttons to slow down or speed up time
	const $timescale =
		$( '<input name="timescale" type="range" min="0.1" step="0.1" max="12.7">' )
	
	{
		const curve     = x => Math.pow( x / 4, 2 )
		const curve_inv = y => Math.pow( y, 1/2 ) * 4
		
		$timescale.on( 'input', () => {
			gameLoop.timescale = curve( $timescale.val() )
		} )
		
		// custom event
		$timescale.on( 'timescale-changed', () => {
			$timescale.val( curve_inv( gameLoop.timescale ) )
		} )
		
		$timescale.trigger( 'timescale-changed' )
	}
	
	const $sloMo =
		$( '<button name="slo-mo">0.25x</button>' )
	
	$sloMo.click( () => {
		gameLoop.timescale = 0.25
		gameLoop.paused = false
		$timescale.trigger( 'timescale-changed' )
	} )
	
	const $normalSpeed =
		$( '<button name="normal-speed">1×</button>' )
	
	$normalSpeed.click( () => {
		gameLoop.timescale = 1
		gameLoop.paused = false
		$timescale.trigger( 'timescale-changed' )
	} )
	
	const $highSpeed =
		$( '<button name="high-speed">10×</button>' )
	
	$highSpeed.click( () => {
		gameLoop.timescale = 10
		gameLoop.paused = false
		$timescale.trigger( 'timescale-changed' )
	} )
	
	$playPause.click( () => {
		gameLoop.paused = !gameLoop.paused
	} )
	
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
			
			case 38: // up arrow
				event.preventDefault()
				$timescale.val( +$timescale.val() + +$timescale.attr( 'step' ) )
				$timescale.trigger( 'input' )
				break
			
			case 39: // right arrow
				event.preventDefault() // may be too much
				$step.click()
				break
			
			case 40: // down arrow
				event.preventDefault()
				$timescale.val( $timescale.val() - $timescale.attr( 'step' ) )
				$timescale.trigger( 'input' )
				break
		}
	} )
	
	$form.append( $playPause )
	$form.append( $step )
	$form.append( $sloMo )
	$form.append( $normalSpeed )
	$form.append( $timescale )
	$form.append( $highSpeed )
	
	return $form[ 0 ]
}
