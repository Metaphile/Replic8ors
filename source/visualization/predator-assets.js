const fs = require( 'fs' )

const canvas = document.createElement( 'canvas' )
const ctx = canvas.getContext( '2d' )

export default {
	skinColor: 'black',
	
	backsideGradient: ( () => {
		const angle = -Math.PI / 4 // -45 degrees
		const offset = -1/3
		const x = Math.cos( angle ) * offset
		const y = Math.sin( angle ) * offset
		
		const gradient = ctx.createRadialGradient( x, y, 0, 0, 0, 1 )
		gradient.addColorStop( 0.2, 'rgba(   0,   0,   0, 0.3 )' )
		gradient.addColorStop( 1.0, 'rgba(   0,   0,   0, 0.9 )' )
		
		return gradient
	} )(),
	
	bloodGradient: ( () => {
		const gradient = ctx.createLinearGradient( 0, -1, 0, 1 )
		
		gradient.addColorStop( 0.500, 'rgba( 160,   0,  20, 0.00 )' ) // transparent red
		gradient.addColorStop( 0.500, 'rgba( 160,   0,  20, 0.60 )' ) // red
		gradient.addColorStop( 0.504, 'rgba(   0,   0,   0, 1.00 )' ) // black
		gradient.addColorStop( 1.000, 'rgba( 160,   0,  20, 1.00 )' ) // red
		
		return gradient
	} )(),
	
	face: ( () => {
		// be careful changing this line
		// brfs is delicate
		const imageData = fs.readFileSync( __dirname + '/replicator-face.png', 'base64' )
		const image = document.createElement( 'img' )
		image.src = 'data:image/png;base64,' + imageData
		
		return image
	} )(),
	
	shadowGradient: ( () => {
		const gradient = ctx.createRadialGradient( 0, 0, 0, 0, 0, 1 )
		
		gradient.addColorStop( 0.0, 'rgba( 14,  14,  61, 0.15 )' )
		gradient.addColorStop( 1.0, 'rgba( 14,  14,  61, 0.0 )' )
		
		return gradient
	} )(),
}
