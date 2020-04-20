import GameLoop from '../engine/game-loop'
import $ from '../../third-party/jquery'
import formTemplate from './form.ejs'
import infoTemplate from './info.ejs'
import { formatElapsedTime } from '../helpers'

// must match method names
export enum State {
	play        = 'play',
	pause       = 'pause',
	fastForward = 'fastForward',
	turbo       = 'turbo',
}

export default function ControlBar( scenarioLoop, visualization ) {
	const onStateChanged = ( oldState, newState ) => {
		$( '.active', $form ).removeClass( 'active' )
		
		const activate = ( selector ) => {
			$( selector, $form ).addClass( 'active' )
		}
		
		switch ( newState ) {
			case State.pause:
				activate( '[name=pause-resume]' )
				break
			
			case State.play:
				activate( '[name=speed-normal]' )
				break
			
			case State.fastForward:
				activate( '[name=speed-fast]' )
				break
			
			case State.turbo:
				activate( '[name=speed-turbo]' )
				break
		}
	}
	
	const self = {
		state: undefined,
		
		playTimescale:         1,
		fastForwardTimescale: 10,
		turboTimescale:       60,
		
		$element: undefined,
		
		pause() {
			this.setState( State.pause )
			scenarioLoop.paused = true
			
			if ( !visualization.attached ) {
				visualization.attach()
			}
		},
		
		step() {
			if ( this.state !== State.pause ) {
				this.pause()
			}
			
			scenarioLoop.step()
		},
		
		play() {
			this.setState( State.play )
			scenarioLoop.paused = false
			scenarioLoop.timescale = this.playTimescale
			
			if ( !visualization.attached ) {
				visualization.attach()
			}
		},
		
		fastForward() {
			this.setState( State.fastForward )
			scenarioLoop.paused = false
			scenarioLoop.timescale = this.fastForwardTimescale
			
			if ( !visualization.attached ) {
				visualization.attach()
			}
		},
		
		turbo() {
			this.setState( State.turbo )
			scenarioLoop.paused = false
			scenarioLoop.timescale = this.turboTimescale
			visualization.detach()
		},
		
		// convenience method for toggling between pause state and play state
		togglePause() {
			if ( this.state !== State.pause ) {
				this.pause()
			} else {
				this.play()
			}
		},
		
		// convenience method for toggling between turbo state and play state
		toggleTurbo() {
			if ( this.state !== State.turbo ) {
				this.turbo()
			} else {
				this.play()
			}
		},
		
		setState( state ) {
			if ( state !== this.state ) {
				const oldState = this.state
				this.state = state
				onStateChanged( oldState, state )
			}
		},
		
		showInfo() {
			$info.show()
		},
		
		toggleInfo() {
			$info.toggle()
		},
	}
	
	self.$element = $( '<div></div>' )
	const $form = $( formTemplate() )
	const $info = $( infoTemplate() )
	self.$element.append( $form )
	self.$element.append( $info )
	
	// prevent submit
	$form.submit( event => event.preventDefault() )
	
	$( '[name=pause-resume]', $form ).click( () => self.togglePause() )
	$( '[name=step]', $form ).click( () => self.step() )
	$( '[name=speed-normal]', $form ).click( () => self.play() )
	$( '[name=speed-fast]', $form ).click( () => self.fastForward() )
	$( '[name=speed-turbo]', $form ).click( () => self.toggleTurbo() )
	
	$( '[name=info]', $form ).click( () => self.toggleInfo() )
	
	$info.click( () => self.toggleInfo() )
	
	// keyboard shortcuts

	enum keys {
		ESCAPE       = 27,
		SPACEBAR     = 32,
		RIGHT_ARROW  = 39,
		NUM_1        = 49,
		NUM_2        = 50,
		NUM_3        = 51,
	}
	
	$( document ).keydown( function ( event ) {
		switch ( event.which ) {
			case keys.ESCAPE:
				event.preventDefault()
				self.toggleInfo()
				break
			
			case keys.SPACEBAR:
				event.preventDefault()
				self.togglePause()
				break
			
			case keys.RIGHT_ARROW:
				event.preventDefault()
				self.step()
				break
			
			case keys.NUM_1:
				event.preventDefault()
				self.play()
				break
			
			case keys.NUM_2:
				event.preventDefault()
				self.fastForward()
				break
			
			case keys.NUM_3:
				event.preventDefault()
				self.toggleTurbo()
				break
		}
	} )
	
	const elapsedSimTime = $( '[name=elapsed-sim-time]', $form )[ 0 ]
	GameLoop( () => {
		elapsedSimTime.value = formatElapsedTime( scenarioLoop.elapsed )
	},
	() => {},
	{ timestep: 1/60 } )
	
	self.setState( State.play )
	
	return self
}
