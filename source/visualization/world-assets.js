const ctx = document.createElement( 'canvas' ).getContext( '2d' )

const particles = []

for ( let n = 17; n > 0; n-- ) {
	const particle = {}
	
	particle.radius = Math.random() * 22
	
	const distance = Math.random() * ( 512 - particle.radius )
	const angle = Math.random() * Math.PI * 2
	
	particle.x = 512 + Math.cos( angle ) * distance
	particle.y = 512 + Math.sin( angle ) * distance
	
	particle.opacity = Math.random() * 0.2
	
	particles.push( particle )
}

export const foregroundTile = ( () => {
	const canvas = document.createElement( 'canvas' )
	canvas.width = canvas.height = 1024
	
	const ctx = canvas.getContext( '2d' )
	
	for ( let particle of particles ) {
		ctx.beginPath()
			ctx.arc( particle.x, particle.y, particle.radius, 0, Math.PI * 2 )
			
			ctx.globalAlpha = particle.opacity
			ctx.fillStyle = 'white'
			ctx.fill()
		
		// TODO wrap horizontally/vertically
	}
	
	return canvas
} )()
