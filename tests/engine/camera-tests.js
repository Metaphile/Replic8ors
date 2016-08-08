import Camera from '../../source/engine/camera'

const precision = 9

describe( 'camera', () => {
	it( 'pans relative', () => {
		const camera = Camera()
		
		// relative pans are cumulative
		camera.pan(  3, -5 )
		camera.pan( -1,  2 )
		//         --------
		//           2, -3
		
		const point_world = { x: 0, y: 0 }
		const point_screen = camera.toScreen( point_world )
		
		expect( point_screen.x ).toBeCloseTo( -2, precision )
		expect( point_screen.y ).toBeCloseTo(  3, precision )
	} )
	
	it( 'pans relative while zoomed', () => {
		const camera = Camera()
		
		const zoomLevel = 2
		
		camera.zoomTo( zoomLevel, { x: 0, y: 0 } )
		camera.pan( 4, 3 )
		
		const point_world = { x: 0, y: 0 }
		const point_screen = camera.toScreen( point_world )
		
		expect( point_screen.x ).toBeCloseTo( -4 * zoomLevel, precision )
		expect( point_screen.y ).toBeCloseTo( -3 * zoomLevel, precision )
	} )
	
	it( 'pans absolute', () => {
		const camera = Camera()
		
		camera.panTo( -7,  3 ) // random point; shouldn't matter
		camera.panTo(  2,  5 ) // final point
		
		const point_world = { x: 0, y: 0 }
		const point_screen = camera.toScreen( point_world )
		
		expect( point_screen.x ).toBeCloseTo( -2, precision )
		expect( point_screen.y ).toBeCloseTo( -5, precision )
	} )
	
	it( 'pans absolute while zoomed', () => {
		const camera = Camera()
		
		const zoomLevel = 0.5
		
		camera.zoomTo( zoomLevel, { x: 0, y: 0 } )
		camera.panTo( 4, 6 )
		
		const point_world = { x: 0, y: 0 }
		const point_screen = camera.toScreen( point_world )
		
		expect( point_screen.x ).toBeCloseTo( -4 * zoomLevel, precision )
		expect( point_screen.y ).toBeCloseTo( -6 * zoomLevel, precision )
	} )
	
	it( 'zooms relative', () => {
		const camera = Camera()
		
		camera.zoom(  1.00, { x: 0, y: 0 } ) // 1 + 100% == 2
		camera.zoom( -0.25, { x: 0, y: 0 } ) // 2 -  25% == 1.5
		
		expect( camera.zoomLevel() ).toBeCloseTo( 1.5, precision )
	} )
	
	it( 'zooms absolute', () => {
		const camera = Camera()
		
		camera.zoomTo( 3, { x: 0, y: 0 } )
		camera.zoomTo( 2, { x: 0, y: 0 } )
		
		expect( camera.zoomLevel() ).toBeCloseTo( 2, precision )
	} )
	
	// test that zooming actually changes view
	// TODO better name
	it( 'zooms', () => {
		const camera = Camera()
		
		const zoomLevel = 2
		
		camera.zoomTo( zoomLevel, { x: 0, y: 0 } )
		
		const point_world = { x: 3, y: -4 }
		const point_screen = camera.toScreen( point_world )
		
		expect( point_screen.x ).toBeCloseTo(  3 * zoomLevel, precision )
		expect( point_screen.y ).toBeCloseTo( -4 * zoomLevel, precision )
	} )
	
	it( 'computes view bounds (simple)', () => {
		const camera = Camera()
		
		const canvas = document.createElement( 'canvas' )
		canvas.width  = 800
		canvas.height = 600
		
		const { topLeft, bottomRight } = camera.viewBounds( canvas )
		
		expect( topLeft.x ).toBeCloseTo( 0, precision )
		expect( topLeft.y ).toBeCloseTo( 0, precision )
		
		expect( bottomRight.x ).toBeCloseTo( 800, precision )
		expect( bottomRight.y ).toBeCloseTo( 600, precision )
	} )
	
	it( 'computes view bounds (advanced)', () => {
		const camera = Camera()
		
		const canvas = document.createElement( 'canvas' )
		canvas.width  = 800
		canvas.height = 600
		
		// zoom in to center of canvas
		camera.zoomTo( 2, { x: 400, y: 300 } )
		
		const { topLeft, bottomRight } = camera.viewBounds( canvas )
		
		expect( topLeft.x ).toBeCloseTo( 800 * 1/4, precision )
		expect( topLeft.y ).toBeCloseTo( 600 * 1/4, precision )
		
		expect( bottomRight.x ).toBeCloseTo( 800 * 3/4, precision )
		expect( bottomRight.y ).toBeCloseTo( 600 * 3/4, precision )
	} )
	
	it( 'computes view center', () => {
		const camera = Camera()
		
		const canvas = document.createElement( 'canvas' )
		canvas.width  = 800
		canvas.height = 600
		
		const center = camera.viewCenter( canvas )
		
		expect( center.x ).toBeCloseTo( 400, precision )
		expect( center.y ).toBeCloseTo( 300, precision )
	} )
} )
