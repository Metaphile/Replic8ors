// TODO I'm not sure I like the way this works
// client might expect `buffer.length` to equal `length`,
// but that won't be true if the buffer is partially empty

export interface RingBuffer<T> extends Array<T> {
	next(): T
}

export default function RingBuffer<T>( length: number ): RingBuffer<T> {
	const buffer = [] as unknown as RingBuffer<T>

	let pushIndex = 0
	let nextIndex = 0

	buffer.push = function ( value: T ): number {
		buffer[ pushIndex ] = value
		pushIndex = ( pushIndex + 1 ) % length
		return buffer.length
	}

	buffer.next = function (): T {
		nextIndex = ( nextIndex + 1 ) % length
		return buffer[ nextIndex ]
	}

	return buffer
}
