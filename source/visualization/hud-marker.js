export default function Marker( opts = {} ) {
	const self = Object.create( Marker.prototype )
	Object.assign( self, opts )
	return self
}

Marker.prototype = {
	size: 21,
	
	draw( ctx, tip, angleToTrackable, trackableSelected ) {
		// Math.random() > 0.996 && console.log( tip )
		
		ctx.beginPath()
			const width = 0.37 // radians
			
			const angleToBase = angleToTrackable + Math.PI
			
			// bottom right corner (when pointing up)
			const base1 = {}
			base1.x = tip.x + Math.cos( angleToBase - width ) * this.size
			base1.y = tip.y + Math.sin( angleToBase - width ) * this.size
			
			// bottom middle
			const base2 = {}
			base2.x = tip.x + Math.cos( angleToBase ) * this.size * 0.8
			base2.y = tip.y + Math.sin( angleToBase ) * this.size * 0.8
			
			// bottm left
			const base3 = {}
			base3.x = tip.x + Math.cos( angleToBase + width ) * this.size
			base3.y = tip.y + Math.sin( angleToBase + width ) * this.size
			
			ctx.moveTo( tip.x, tip.y )
			ctx.lineTo( base1.x, base1.y )
			ctx.lineTo( base2.x, base2.y )
			ctx.lineTo( base3.x, base3.y )
			ctx.closePath()
			
			ctx.fillStyle = 'rgba( 255, 70, 0, 0.45 )'
			ctx.fill()
	}
}
