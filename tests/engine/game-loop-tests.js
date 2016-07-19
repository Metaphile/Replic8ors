// TODO use loop.step() more

import GameLoop from '../../source/engine/game-loop'

const precision = 9
const error = Math.pow( 10, -precision )
const nope = () => {}

describe( 'game loop', () => {
	const opts = {
		timestep: 1/60,
		timescale: 1,
		maxPendingUpdates: 10,
	}
	
	it( 'calls update() with a fixed timestep', () => {
		const update = jasmine.createSpy()
		const loop = GameLoop( update, nope, opts )
		
		// slightly less than one timestep
		loop.advance( 1/60 - error )
		expect( update.calls.count() ).toBe( 0 )
		
		// slightly more than one timestep
		loop.advance( 1/60 + error )
		expect( update.calls.count() ).toBe( 1 )
	} )
	
	it( 'tracks total elapsed time (quantized)', () => {
		const update = jasmine.createSpy()
		const loop = GameLoop( update, nope, opts )
		
		const elapsed = () => update.calls.mostRecent().args[ 1 ]
		
		loop.advance( 2/60 + error )
		expect( elapsed() ).toBeCloseTo( 2/60, precision )
	} )
	
	it( 'can do multiple updates per frame to catch up', () => {
		const update = jasmine.createSpy()
		const loop = GameLoop( update, nope, opts )
		
		// say it's been a couple of timesteps since the last update
		loop.advance( 2/60 + error )
		expect( update.calls.count() ).toBe( 2 )
	} )
	
	it( 'limits pending updates', () => {
		const update = jasmine.createSpy()
		const loop = GameLoop( update, nope, opts )
		
		loop.advance( 1 ) // would result in 60 updates
		expect( update.calls.count() ).toBe( 10 ) // loop stops at 10
	} )
	
	it( 'can run slower/faster than real time', () => {
		const update = jasmine.createSpy()
		const loop = GameLoop( update, nope, opts )
		
		loop.timescale = 0.5
		loop.advance( 4/60 + error )
		
		expect( update.calls.count() ).toBe( 2 )
	} )
	
	it( 'can pause updates', () => {
		const update = jasmine.createSpy()
		const draw = jasmine.createSpy()
		const loop = GameLoop( update, draw, opts )
		
		loop.paused = true
		loop.advance( 1 )
		
		expect( update.calls.count() ).toBe( 0 )
		expect( draw.calls.count() ).toBe( 1 )
	} )
	
	// this test is for a bug where the loop would try to catch up
	// (maxPendingUpdates) after being unpaused
	it( 'resumes updates where it left off', () => {
		const update = jasmine.createSpy()
		const loop = GameLoop( update, nope, opts )
		
		loop.paused = true
		loop.advance( 1/60 )
		
		loop.paused = false
		loop.advance( 2/60 + error )
		expect( update.calls.count() ).toBe( 1 ) // used to be 2
	} )
	
	it( 'can step forward', () => {
		const update = jasmine.createSpy()
		const loop = GameLoop( update, nope, opts )
		
		loop.step()
		
		expect( update.calls.count() ).toBe( 1 )
	} )
	
	// TODO steps when paused
	
	it( 'passes correct dt/t when stepping', () => {
		const update = jasmine.createSpy()
		const loop = GameLoop( update, nope, opts )
		
		loop.step()
		loop.step()
		
		const [ dt, elapsed ] = update.calls.mostRecent().args
		expect( dt ).toBeCloseTo( 1/60, precision )
		expect( elapsed ).toBeCloseTo( 2/60, precision )
	} )
	
	it( 'calls draw() for every animation frame', () => {
		const draw = jasmine.createSpy()
		
		const loop = GameLoop( nope, draw, opts )
		
		loop.advance( 0 )
		loop.advance( 0 )
		
		expect( draw.calls.count() ).toBe( 2 )
	} )
	
	it( 'passes time since last update to draw()', () => {
		const draw = jasmine.createSpy()
		const loop = GameLoop( nope, draw, opts )
		
		const ahead = () => draw.calls.mostRecent().args[ 0 ]
		
		loop.advance( 0 )
		expect( ahead() ).toBeCloseTo( 0, precision )
		
		loop.advance( 1/60 + error )
		expect( ahead() ).toBeCloseTo( error, precision )
	} )
	
	it( 'emits step event', () => {
		const loop = GameLoop( nope, nope )
		const spy = jasmine.createSpy()
		loop.on( 'step', spy )
		loop.step()
		expect( spy ).toHaveBeenCalled()
	} )
} )
