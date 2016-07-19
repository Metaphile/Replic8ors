// TODO Stack Overflow credit

export default function RingBuffer( length ) {
	const buffer = []
	let pointer = 0
	
	buffer.push = function ( value ) {
		buffer[ pointer ] = value
		pointer = ( pointer + 1 ) % length
	}
	
	return buffer
}
