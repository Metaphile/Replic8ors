export default {
	TAU: Math.PI * 2, // tauday.com
	
	randRange: function ( min, max ) {
		return min + ( Math.random() * ( max - min ) )
	},
	
	clamp: function ( value, min, max ) {
		if ( value < min ) {
			return min
		} else if ( value > max ) {
			return max
		} else {
			return value
		}
	},
}
