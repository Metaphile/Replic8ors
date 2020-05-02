// TODO I'm not sure I like the way this works
// client might expect `buffer.length` to equal `length`,
// but that won't be true if the buffer is partially empty

export default function RingBuffer( length ) {
	const buffer = []
	
	let pushIndex = 0
	let nextIndex = 0
	
	buffer.push = function ( value ) {
		buffer[ pushIndex ] = value
		pushIndex = ( pushIndex + 1 ) % length
	}
	
	buffer.next = function () {
		nextIndex = ( nextIndex + 1 ) % length
		return buffer[ nextIndex ]
	}
	
	return buffer
}
