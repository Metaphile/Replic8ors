// format weight for display
export function formatWeight( w: number ): string {
	const digits = 4
	const separator = '.'
	
	const sign = ( w >= 0 ? ' ' : '-' )
	w = Math.abs( w )
	
	// 0.6666 => 666.6
	w *= Math.pow( 10, digits - 1 )
	// 666.6 => 667
	w = Math.round( w )
	
	let str = String( w )
	// left-pad with zeroes
	str = '0'.repeat( digits - str.length ) + str
	
	// prepend sign; insert separator after leftmost digit
	return sign + str.slice( 0, 1 ) + separator + str.slice( 1 )
}
