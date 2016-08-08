export default function Vector2( x = 0, y = 0 ) {
	return { x, y }
}
	
Object.assign( Vector2, {
	clone( v ) { return { x: v.x, y: v.y } },
	
	add( v1, v2, out = v1 ) {
		out.x = v1.x + v2.x
		out.y = v1.y + v2.y
		
		return out
	},
	
	subtract( v1, v2, out = v1 ) {
		out.x = v1.x - v2.x
		out.y = v1.y - v2.y
		
		return out
	},
	
	scale( v, s, out = v ) {
		out.x = v.x * s
		out.y = v.y * s
		
		return out
	},
	
	invert( v, out = v ) {
		out.x = -v.x
		out.y = -v.y
		
		return out
	},
	
	set( v1, v2 ) {
		v1.x = v2.x
		v1.y = v2.y
	},
	
	// 'length' is taken
	getLength( v ) {
		return Math.sqrt( ( v.x * v.x ) + ( v.y * v.y ) );
	},
	
	lengthSquared( v ) {
		return ( v.x * v.x ) + ( v.y * v.y )
	},
	
	setLength( v, s, out = v ) {
		var a = Math.atan2( v.y, v.x )
		out.x = Math.cos( a ) * s
		out.y = Math.sin( a ) * s
		
		return out
	},
	
	distanceSquared( v1, v2 ) {
		var dx = v2.x - v1.x
		var dy = v2.y - v1.y
		
		return ( dx * dx ) + ( dy * dy )
	},
	
	distance( v1, v2 ) {
		var dx = v2.x - v1.x
		var dy = v2.y - v1.y
		
		return Math.sqrt( ( dx * dx ) + ( dy * dy ) )
	},
	
	angle( v ) {
		let a = Math.atan2( v.y, v.x )
		if ( a < 0 ) a += Math.PI * 2
		return a
	},
	
	rotate( v, angle, out = v ) {
		const oldLength = Vector2.getLength( v )
		const newAngle = Vector2.angle( v ) + angle
		
		out.x = Math.cos( newAngle ) * oldLength
		out.y = Math.sin( newAngle ) * oldLength
		
		return out
	},
	
	isNonZero( v ) {
		return ( v.x !== 0 ) || ( v.y !== 0 )
	},
	
	normalize( v, out = v ) {
		var angle = Math.atan2( v.y, v.x )
		
		out.x = Math.cos( angle )
		out.y = Math.sin( angle )
		
		return out
	},
} )
