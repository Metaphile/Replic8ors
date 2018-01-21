// TODO Stack Overflow credit

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
