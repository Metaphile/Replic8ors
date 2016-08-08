import Hud from '../../source/visualization/hud'
import Camera from '../../source/engine/camera'

const precision = 9

describe( 'hud', () => {
	let canvas, ctx, camera, hud, trackable, marker
	
	beforeEach( () => {
		canvas = document.createElement( 'canvas' )
		ctx = canvas.getContext( '2d' )
		canvas.width = 800
		canvas.height = 600
		
		camera = Camera()
		
		hud = Hud( camera )
		
		trackable = {
			position: { x: 0, y: 0 },
			radius: 1,
		}
		
		marker = jasmine.createSpyObj( 'marker', [ 'draw' ] )
		
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
		const padding = 24
		const markerPosition = () => marker.draw.calls.mostRecent().args[1]
		
		trackable.position = { x: 9999, y: 300 } // far right
		hud.draw( ctx )
		expect( markerPosition().x ).toBeCloseTo( 800 - padding, precision )
		expect( markerPosition().y ).toBeCloseTo( 300, precision )
		
		// TODO bottom right case, top left case?
	} )
} )
