// const fs = require( 'fs' )
const fs = { readFileSync: () => {} }

export const icons = {
	food: ( () => {
		const imageData = fs.readFileSync( __dirname + '/icons/food.png', 'base64' )
		const image = document.createElement( 'img' )
		image.src = 'data:image/png;base64,' + imageData
		
		return image
	} )(),
	
	predator: ( () => {
		const imageData = fs.readFileSync( __dirname + '/icons/predator.png', 'base64' )
		const image = document.createElement( 'img' )
		image.src = 'data:image/png;base64,' + imageData
		
		return image
	} )(),
	
	replicator: ( () => {
		const imageData = fs.readFileSync( __dirname + '/icons/replicator.png', 'base64' )
		const image = document.createElement( 'img' )
		image.src = 'data:image/png;base64,' + imageData
		
		return image
	} )(),
	
	think: ( () => {
		const imageData = fs.readFileSync( __dirname + '/icons/think.png', 'base64' )
		const image = document.createElement( 'img' )
		image.src = 'data:image/png;base64,' + imageData
		
		return image
	} )(),
	
	flipper: ( () => {
		const imageData = fs.readFileSync( __dirname + '/icons/move.png', 'base64' )
		const image = document.createElement( 'img' )
		image.src = 'data:image/png;base64,' + imageData
		
		return image
	} )(),
	
	empty: ( () => {
		const imageData = fs.readFileSync( __dirname + '/icons/energy.png', 'base64' )
		const image = document.createElement( 'img' )
		image.src = 'data:image/png;base64,' + imageData
		
		return image
	} )(),
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
