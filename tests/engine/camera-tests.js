import Camera from '../../source/engine/camera'

const precision = 9

describe( 'camera', () => {
	function TestCamera() {
		const canvas = document.createElement( 'canvas' )
		canvas.width  = 640
		canvas.height = 480
		const ctx = canvas.getContext( '2d' )
		
		const camera = Camera( ctx )
		
		return camera
	}
	
	it( 'pans relative', () => {
		const camera = TestCamera()
		camera.pan( 10, 5 ) // pan to the right and down
		
		const point_screen = { x: 0, y: 0 }
		const point_world = camera.toWorld( point_screen )
		
		expect( point_world.x ).toBeCloseTo( 10, precision )
		expect( point_world.y ).toBeCloseTo(  5, precision )
	} )
	
	it( 'zooms relative', () => {
		const camera = TestCamera()
		
		const point_world = { x: -10, y: 5 }
		camera.zoom( 0.2, { x: 0, y: 0 } ) // increase zoom by 1/5
		const point_screen = camera.toScreen( point_world )
		
		expect( point_screen.x ).toBeCloseTo( -12, precision )
		expect( point_screen.y ).toBeCloseTo(   6, precision )
	} )
	
	it( 'maps points between screenspace/worldspace', () => {
		const camera = TestCamera()
		
		camera.pan( 7, -13 )
		
		const point_screen = { x: 0, y: 0 }
		const point_world = camera.toWorld( point_screen )
		
		expect( point_world.x ).toBeCloseTo(   7, precision )
		expect( point_world.y ).toBeCloseTo( -13, precision )
		
		const point_screen_again = camera.toScreen( point_world )
		
		expect( point_screen_again.x ).toBeCloseTo( 0, precision )
		expect( point_screen_again.y ).toBeCloseTo( 0, precision )
	} )
} )
