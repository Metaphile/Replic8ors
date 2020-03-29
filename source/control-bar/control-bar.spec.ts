import ControlBar, { State } from './control-bar'

describe( 'control bar', () => {
	let mockVisualization
	let mockScenarioLoop
	let controlBar
	
	beforeEach( () => {
		mockVisualization = {
			attached: true,
			attach: function () {
				this.attached = true
			},
			detach: function () {
				this.attached = false
			},
		}
		
		spyOn( mockVisualization, 'attach' ).and.callThrough()
		spyOn( mockVisualization, 'detach' ).and.callThrough()
		
		mockScenarioLoop = {
			timestep: 1/60,
			timescale: 1,
			step: jasmine.createSpy( 'mockScenarioLoop.step' ),
		}
		
		controlBar = ControlBar( mockScenarioLoop, mockVisualization )
	} )
	
	it( 'detaches visualization when entering turbo state', () => {
		controlBar.turbo()
		expect( mockVisualization.detach ).toHaveBeenCalled()
	} )
	
	describe( 'attaches visualization when exiting turbo state', () => {
		beforeEach( () => {
			controlBar.turbo()
		} )
		
		it( 'turbo -> pause', () => {
			controlBar.pause()
			expect( mockVisualization.attach ).toHaveBeenCalled()
		} )
		
		it( 'turbo -> play', () => {
			controlBar.play()
			expect( mockVisualization.attach ).toHaveBeenCalled()
		} )
		
		it( 'turbo -> fast forward', () => {
			controlBar.fastForward()
			expect( mockVisualization.attach ).toHaveBeenCalled()
		} )
	} )
	
	it( 'doesn\'t attach attached visualization', () => {
		controlBar.pause()
		expect( mockVisualization.attach ).not.toHaveBeenCalled()
	} )
	
	it( 'toggles between pause and play', () => {
		controlBar.togglePause()
		expect( controlBar.state ).toBe( State.pause )
		
		controlBar.togglePause()
		expect( controlBar.state ).toBe( State.play )
	} )
	
	it( 'toggles between turbo and play', () => {
		controlBar.toggleTurbo()
		expect( controlBar.state ).toBe( State.turbo )
		
		controlBar.toggleTurbo()
		expect( controlBar.state ).toBe( State.play )
	} )
	
	it( 'pauses on step', () => {
		controlBar.step()
		expect( controlBar.state ).toBe( State.pause )
	} )
	
	it( 'steps scenario loop on step', () => {
		controlBar.step()
		expect( mockScenarioLoop.step ).toHaveBeenCalled()
	} )
	
	describe( 'sets scenario loop timescale', () => {
		beforeEach( () => {
			mockScenarioLoop.timescale = undefined
		} )
		
		it( 'play', () => {
			controlBar.play()
			expect( mockScenarioLoop.timescale ).toBe( controlBar.playTimescale )
		} )
		
		it( 'fast forward', () => {
			controlBar.fastForward()
			expect( mockScenarioLoop.timescale ).toBe( controlBar.fastForwardTimescale )
		} )
		
		it( 'turbo', () => {
			controlBar.turbo()
			expect( mockScenarioLoop.timescale ).toBe( controlBar.turboTimescale )
		} )
	} )
	
	it( 'timescale: turbo > fast forward > play', () => {
		expect( controlBar.turboTimescale ).toBeGreaterThan( controlBar.fastForwardTimescale )
		expect( controlBar.fastForwardTimescale ).toBeGreaterThan( controlBar.playTimescale )
	} )
} )
