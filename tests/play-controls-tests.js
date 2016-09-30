import $ from '../third-party/jquery'
import GameLoop from '../source/engine/game-loop'
import PlayControls from '../source/play-controls'

// last time I ran this I got the error,
// "Some of your tests did a full page reload!"
// which also prevented notifier from working
// pretty sure the clicks are submitting the form
describe( 'play controls', () => {
	const nope = () => {}
	
	it( 'factory returns a DOM element', () => {
		const controls = PlayControls( GameLoop( nope, nope ) )
		expect( 'tagName' in controls ).toBe( true )
	} )
	
	it( 'pause/resume button toggles playback', () => {
		const loop = GameLoop( nope, nope )
		const controls = PlayControls( loop )
		
		$( '[name=pause-resume]', controls ).click()
		expect( loop.paused ).toBe( true )
		
		$( '[name=pause-resume]', controls ).click()
		expect( loop.paused ).toBe( false )
	} )
} )
