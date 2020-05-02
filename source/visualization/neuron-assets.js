import predatorImageSrc   from './icons/predator.png'
import preyImageSrc       from './icons/prey.png'
import blueImageSrc       from './icons/blue.png'
import thinkImageSrc      from './icons/think.png'
import moveImageSrc       from './icons/move.png'
import energyImageSrc     from './icons/energy.png'

export const icons = {
	predator: ( () => {
		const image = document.createElement( 'img' )
		image.src = predatorImageSrc
		
		return image
	} )(),
	
	prey: ( () => {
		const image = document.createElement( 'img' )
		image.src = preyImageSrc
		
		return image
	} )(),
	
	blue: ( () => {
		const image = document.createElement( 'img' )
		image.src = blueImageSrc
		
		return image
	} )(),
	
	think: ( () => {
		const image = document.createElement( 'img' )
		image.src = thinkImageSrc
		
		return image
	} )(),
	
	flipper: ( () => {
		const image = document.createElement( 'img' )
		image.src = moveImageSrc
		
		return image
	} )(),
	
	empty: ( () => {
		const image = document.createElement( 'img' )
		image.src = energyImageSrc
		
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
