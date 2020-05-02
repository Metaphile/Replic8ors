import Events from '../engine/events'

export const setSetting = ( section, key, value ) => {
	const oldValue = settings[ key ]
	
	if ( value !== oldValue ) {
		settings[ section ][ key ] = value
		settingsEvents.emit( 'setting-changed', section, key, value )
	}
}

export const settingsEvents = Events()

const scenario = {
	minReds:    3,
	maxReds:   21,
	minGreens: 10,
	maxGreens: 52,
	minBlues:   4,
	maxBlues:  17,
}

const replicator = {
	type: 'replicator',
	
	radius: 32,
	mass: 90,
	drag: 260,
	elasticity: 0.4,
	
	energy: 0.666,
	metabolism: 1 / ( 2 * 60 ),
	energyCostPerNeuronSpike: 0.0,
	
	receptorOffset: -Math.PI / 2, // up
	flipperOffset: -Math.PI / 2 + ( Math.PI / 3 ),
	flipperStrength: 22000,
	
	numBodySegments: 3,
	numInternalNeurons: 0,
	potentialDecayRate: 0.3,
	
	// collision values
	predatorValue: 0.0,
	preyValue: 0.0,
	blueValue: 0.0,
}

// reds
const predator = {
	...replicator,
	
	type: 'predator',
	
	radius: 32,
	mass: 17,
	metabolism: 0.005,
	
	// collision values
	predatorValue:  0.0,
	preyValue:     -0.1,
	blueValue:      0.67,
}

// greens
const prey = {
	...replicator,
	
	type: 'prey',
	
	radius: 27,
	mass: 209,
	metabolism: 0.003,
	
	// collision values
	predatorValue: -0.1,
	preyValue:      0.0,
	blueValue:     -0.2,
}

// blues
const blue = {
	...replicator,
	
	type: 'blue',
	
	radius: 41,
	mass: 152,
	metabolism: 0.008,
	
	// collision values
	predatorValue: -1.0,
	preyValue:      0.209,
	blueValue:      0.0,
}

const settings = {
	scenario,
	replicator,
	predator,
	prey,
	blue,
}

const defaultSettings = {}

for ( const key of Object.keys( settings ) ) {
	defaultSettings[ key ] = { ...settings[ key ] }
}

export default settings
export { defaultSettings }
