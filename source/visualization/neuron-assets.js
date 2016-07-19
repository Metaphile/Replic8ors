const fs = require( 'fs' )

const icons = {}

{
	const imageData = fs.readFileSync( __dirname + '/think.png', 'base64' )
	const image = document.createElement( 'img' )
	image.src = 'data:image/png;base64,' + imageData
	
	icons.think = upscale( image )
}

// TODO this isn't working... :(
function upscale( image ) {
	const canvas = document.createElement( 'canvas' )
	const ctx = canvas.getContext( '2d' )
	
	canvas.width  = image.width  * 4
	canvas.height = image.height * 4
	
	image.style.imageRendering = 'pixelated'
	ctx.drawImage( image, 0, 0, canvas.width, canvas.height )
	
	return canvas
}

export default {
	body: ( () => {
		const radius = 7
		
		const canvas = document.createElement( 'canvas' )
		canvas.width = canvas.height = radius * 2
		const ctx = canvas.getContext( '2d' )
		
		ctx.beginPath()
			ctx.arc( radius, radius, radius, 0, Math.PI * 2 )
			ctx.fillStyle = 'rgba( 0, 255, 255, 0.3 )'
			ctx.fill()
		
		return canvas
	} )(),
	
	icons: icons,
}
