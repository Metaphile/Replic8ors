import Events from './events'

// based on http://www.koonsolo.com/news/dewitters-gameloop/

// draw() is rarely needed
// not for the world, not for the scenario
// only for the visualization
// and very little of GameLoop's logic concerns draw()

const defaultOpts = {
	timestep: 1/60,
	timescale: 1,
	paused: false,
	// MAYBE -> maxBehind
	maxPendingUpdates: 30,
}

export default function GameLoop( update, draw, opts = {} ) {
	const self = {}
	Events( self )
	
	let then = 0 // time of last frame
	let pending = 0
	self.elapsed = 0 // total elapsed time (virtual)
	
	self.advance = function ( now ) {
		if ( !self.paused ) {
			const interval = ( now - then ) * self.timescale
			const maxPending = self.timestep * self.maxPendingUpdates
			pending = Math.min( pending + interval, maxPending )
			
			while ( pending >= self.timestep ) {
				pending -= self.timestep
				self.elapsed += self.timestep
				
				update( self.timestep, self.elapsed )
			}
		}
		
		// always draw
		draw( pending )
		
		then = now // we're at now, now
	}
	
	// TODO honor timescale?
	self.step = function () {
		self.elapsed += self.timestep
		self.emit( 'step', self.timestep, self.elapsed )
		update( self.timestep, self.elapsed )
	}
	
	Object.assign( self, defaultOpts, opts )
	
	function onAnimationFrame( now ) {
		self.advance( now / 1000 ) // milliseconds -> seconds
		requestAnimationFrame( onAnimationFrame )
	}
	
	requestAnimationFrame( onAnimationFrame )
	
	return self
}
