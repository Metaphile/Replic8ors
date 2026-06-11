// @vitest-environment happy-dom
import Hud from './hud'
import Camera from '../engine/camera'
import { CtxPartialStateStack } from '../helpers'

const precision = 9

// TODO Phase 3: these tests need a real canvas 2D context (CtxPartialStateStack),
// which headless DOMs don't provide. Verify HUD rendering in-browser instead.
describe.skip( 'hud', () => {
	let canvas, ctx, camera, hud, trackable, marker
	
	beforeEach( () => {
		canvas = document.createElement( 'canvas' )
		ctx = CtxPartialStateStack( canvas.getContext( '2d' ) )
		canvas.width = 800
		canvas.height = 600
		
		camera = Camera()
		
		hud = Hud( camera )
		
		trackable = {
			position: { x: 0, y: 0 },
			radius: 1,
		}
		
		marker = { draw: vi.fn() }
		
		hud.track( trackable, marker )
	} )
	
	it( 'draws indicators for offscreen trackables', () => {
		trackable.position = { x: 400, y: 300 } // center screen
		hud.draw( ctx )
		expect( marker.draw ).not.toHaveBeenCalled()
		
		trackable.position = { x: 9999, y: 300 } // far right
		hud.draw( ctx )
		expect( marker.draw ).toHaveBeenCalled()
	} )
	
	it( 'draws offscreen indicators at screen edge', () => {
		const padding = 12
		const markerPosition = () => marker.draw.mock.lastCall[1]
		
		trackable.position = { x: 9999, y: 300 } // far right
		hud.draw( ctx )
		expect( markerPosition().x ).toBeCloseTo( 800 - padding, precision )
		expect( markerPosition().y ).toBeCloseTo( 300, precision )
		
		// TODO bottom right case, top left case?
	} )
} )
