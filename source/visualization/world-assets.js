const ctx = document.createElement( 'canvas' ).getContext( '2d' )

const defaultOpts = {
	numParticles: 32,
	minParticleSize: 2,
	maxParticleSize: 50,
	radius: 800,
}

export function Foreground( opts = {} ) {
	opts = Object.assign( defaultOpts, opts )
	
	const particles = []

	for ( let n = opts.numParticles; n > 0; n-- ) {
		const particle = {}
		
		particle.radius = opts.minParticleSize + Math.random() * ( opts.maxParticleSize - opts.minParticleSize )
		
		const angle = Math.random() * Math.PI * 2
		const distance = Math.random() * opts.radius
		const weight = 1 - Math.pow( distance / opts.radius, 2 )
		
		particle.x = Math.cos( angle ) * weight * opts.radius
		particle.y = Math.sin( angle ) * weight * opts.radius
		
		particle.opacity = Math.random() * ( 1 - weight ) * 0.07
		
		particles.push( particle )
	}
	
	return {
		draw( ctx, offset ) {
			const globalAlpha = ctx.globalAlpha
			ctx.translate( -offset.x, -offset.y )
			
			for ( let particle of particles ) {
				ctx.beginPath()
					ctx.arc( particle.x, particle.y, particle.radius, 0, Math.PI * 2 )
					ctx.fillStyle = 'white'
					ctx.globalAlpha = particle.opacity
					ctx.fill()
			}
			
			ctx.translate( offset.x, offset.y )
			ctx.globalAlpha = globalAlpha
		},
	}
}
