export default function Tween( start, end, duration = 1, tweener = Tween.linear ) {
	const self = Object.create( Tween.prototype )
	self.reset()
	
	return self
}

Tween.prototype = {
	reset() {
		this.elapsed = 0
		this.current = this.start
		this.done = false
	},
	
	update( dt ) {
		this.elapsed += dt
		
		if ( this.elapsed < this.duration ) {
			this.current = this.tweener( this.start, this.end, this.elapsed / this.duration )
		} else {
			this.elapsed = this.duration
			this.current = this.tweener( this.start, this.end, 1 )
			this.done = true
			this.emit( 'done', this )
		}
	},
}

Tween.linear = ( start, end, bias ) => {
	return start + bias * ( end - start )
}
