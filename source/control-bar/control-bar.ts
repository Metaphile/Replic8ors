import GameLoop from '../engine/game-loop'
import * as $ from 'jquery'
import formTemplate from './form.ejs'
import infoTemplate from './info.ejs'
import { formatElapsedTime } from '../helpers'
import SettingsPanel from '../settings/settings-panel'

// must match method names
export enum State {
	play        = 'play',
	pause       = 'pause',
	fastForward = 'fastForward',
	turbo       = 'turbo',
}

export default function ControlBar( scenarioLoop, visualization ) {
	const settingsPanel = SettingsPanel()
	
	const activate = ( selector ) => {
		$( selector, $form ).addClass( 'active' )
	}
	
	const deactivate = ( selector ) => {
		$( selector, $form ).removeClass( 'active' )
	}
	
	const onStateChanged = ( oldState, newState ) => {
		$( '.transport.active', $form ).removeClass( 'active' )
		
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
			this.beginStep()
			this.endStep()
		},
		
		beginStep() {
			if ( this.state !== State.pause ) {
				this.pause()
			}
			
			scenarioLoop.step()
			
			activate( '[name=step]' )
		},
		
		endStep() {
			deactivate( '[name=step]' )
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
		
		showSettings() {
			settingsPanel.$element.show()
			
			activate( '[name=settings]' )
		},
		
		toggleSettings() {
			settingsPanel.$element.toggle()
			
			if ( settingsPanel.$element.is( ':visible' ) ) {
				activate( '[name=settings]' )
			} else {
				deactivate( '[name=settings]' )
			}
		},
		
		showInfo() {
			$info.show()
			
			activate( '[name=info]' )
		},
		
		toggleInfo() {
			$info.toggle()
			
			if ( $info.is( ':visible' ) ) {
				activate( '[name=info]' )
			} else {
				deactivate( '[name=info]' )
			}
		},
	}
	
	self.$element = $( '<div></div>' )
	const $form = $( formTemplate() )
	const $info = $( infoTemplate() )
	self.$element.append( $form )
	self.$element.append( settingsPanel.$element )
	self.$element.append( $info )
	
	// prevent submit
	$form.submit( event => event.preventDefault() )
	
	$( '[name=settings]', $form ).click( () => self.toggleSettings() )
	
	$( '[name=pause-resume]', $form ).click( () => self.togglePause() )
	$( '[name=step]', $form ).mousedown( () => self.beginStep() )
	$( '[name=step]', $form ).mouseup( () => self.endStep() )
	$( '[name=speed-normal]', $form ).click( () => self.play() )
	$( '[name=speed-fast]', $form ).click( () => self.fastForward() )
	$( '[name=speed-turbo]', $form ).click( () => self.turbo() )
	
	$( '[name=info]', $form ).click( () => self.toggleInfo() )
	
	$info.click( () => self.toggleInfo() )
	
	// keyboard shortcuts

	enum keys {
		ENTER        = 13,
		ESCAPE       = 27,
		SPACEBAR     = 32,
		RIGHT_ARROW  = 39,
		NUM_1        = 49,
		NUM_2        = 50,
		NUM_3        = 51,
		BACKTICK     = 192,
	}
	
	const numberInputHasFocus = () => {
		const el = <any>document.activeElement
		return el.tagName === 'INPUT' && el.type === 'number'
	}
	
	const rangeInputHasFocus = () => {
		const el = <any>document.activeElement
		return el.tagName === 'INPUT' && el.type === 'range'
	}
	
	const buttonHasFocus = () => {
		const el = <any>document.activeElement
		return el.tagName === 'BUTTON'
	}
	
	const stepButtonHasFocus = () => {
		const el = <any>document.activeElement
		return el.tagName === 'BUTTON' && el.name === 'step'
	}
	
	$( document ).keydown( function ( event ) {
		switch ( event.which ) {
			case keys.ENTER:
				if ( stepButtonHasFocus() ) {
					self.beginStep()
				}
				break
			
			case keys.SPACEBAR:
				if ( stepButtonHasFocus() ) {
					self.beginStep()
				} else if ( buttonHasFocus() ) {
					return
				} else {
					self.togglePause()
				}
				break
			
			case keys.RIGHT_ARROW:
				if ( numberInputHasFocus() || rangeInputHasFocus() ) {
					return
				}
				self.beginStep()
				break
			
			case keys.NUM_1:
				if ( numberInputHasFocus() ) {
					return
				}
				self.play()
				break
			
			case keys.NUM_2:
				if ( numberInputHasFocus() ) {
					return
				}
				self.fastForward()
				break
			
			case keys.NUM_3:
				if ( numberInputHasFocus() ) {
					return
				}
				self.turbo()
				break
			
			case keys.BACKTICK:
				event.preventDefault()
				self.toggleSettings()
				break
		}
	} )
	
	$( document ).keyup( function ( event ) {
		switch ( event.which ) {
			case keys.ENTER:
				if ( stepButtonHasFocus() ) {
					self.endStep()
				}
				break
			
			case keys.SPACEBAR:
				if ( stepButtonHasFocus() ) {
					self.endStep()
				}
				break
			
			case keys.RIGHT_ARROW:
				if ( numberInputHasFocus() || rangeInputHasFocus() ) {
					return
				}
				self.endStep()
				break
		}
	} )
	
	const elapsedSimTime = <HTMLInputElement>$( '[name=elapsed-sim-time]', $form )[ 0 ]
	GameLoop( () => {
		elapsedSimTime.value = formatElapsedTime( scenarioLoop.elapsed )
	},
	() => {},
	{ timestep: 1/60 } )
	
	self.showSettings()
	self.setState( State.play )
	
	return self
}
