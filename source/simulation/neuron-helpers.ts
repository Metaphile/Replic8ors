// maps -1..1 to -Infinity..Infinity
export const potentialDecayFn = x => (
	Math.tan( ( Math.PI / 2 ) * x ) * 0.9
)
