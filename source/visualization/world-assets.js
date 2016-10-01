const ctx = document.createElement( 'canvas' ).getContext( '2d' )

const defaultOpts = {
	numParticles: 32,
	minParticleSize: 2,
	maxParticleSize: 32,
	radius: 500,
}

export function Foreground( opts = {} ) {
	opts = Object.assign( defaultOpts, opts )
	
	const particles = []

	for ( let n = opts.numParticles; n > 0; n-- ) {
		const particle = {}
		
		particle.radius = opts.minParticleSize + Math.random() * ( opts.maxParticleSize - opts.minParticleSize )
		
		particle.x = -opts.radius + Math.random() * ( opts.radius * 2 )
		particle.y = -opts.radius + Math.random() * ( opts.radius * 2 )
		
		particle.opacity = Math.random() * 0.1
		// particle.opacity = 1
		
		particles.push( particle )
	}
	
	return {
		update( dt ) {
			for ( const particle of particles ) {
				particle.x -= 10 * dt
				particle.y += 10 * dt
				
				if ( particle.x < -opts.radius ) {
					particle.x =  opts.radius
					particle.y = -opts.radius + Math.random() * ( opts.radius * 2 )
				}
				
				if ( particle.y > opts.radius ) {
					particle.x = -opts.radius + Math.random() * ( opts.radius * 2 )
					particle.y = -opts.radius
				}
			}
		},
		
		draw( ctx, offset ) {
			const globalAlpha = ctx.globalAlpha
			ctx.translate( -offset.x, -offset.y )
			
			for ( const particle of particles ) {
				const distance = Math.sqrt( ( particle.x * particle.x ) + ( particle.y * particle.y ) )
				const opacityWeight = distance < opts.radius ? 1 - ( distance / opts.radius ) : 0
				
				ctx.beginPath()
					ctx.arc( particle.x, particle.y, particle.radius, 0, Math.PI * 2 )
					ctx.fillStyle = 'white'
					ctx.globalAlpha = particle.opacity * opacityWeight
					ctx.fill()
			}
			
			ctx.translate( offset.x, offset.y )
			ctx.globalAlpha = globalAlpha
		},
	}
}
