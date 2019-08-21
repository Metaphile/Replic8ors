// TODO I'm not sure I like the way this works
// client might expect `buffer.length` to equal `length`,
// but that won't be true if the buffer is partially empty

export default function RingBuffer( length ) {
	const buffer = []
	let pointer = 0
	
	buffer.push = function ( value ) {
		buffer[ pointer ] = value
		pointer = ( pointer + 1 ) % length
	}
	
	buffer.current = function () {
		// mod buffer length because buffer might not be full
		return buffer[ Math.abs( pointer - 1 ) % buffer.length ]
	}
	
	return buffer
}
