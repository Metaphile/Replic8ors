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
	maxPredators: 11,
	maxPreys: 13,
	maxFoods: 21,
}

const replicator = {
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
	numInternalNeurons: 3,
	potentialDecayRate: 0.0,
	
	// collision values
	predatorValue: 0.0,
	preyValue: 0.0,
	foodValue: 0.0,
}

const predator = {
	...replicator,
	
	// collision values
	predatorValue: 0.0,
	preyValue: 0.667,
	foodValue: -0.101,
}

const prey = {
	...replicator,
	
	// collision values
	predatorValue: -0.334,
	preyValue: 0.0,
	foodValue: 0.334,
}

const food = {
	calories: 0.7,
	shelfLife: 5 * 60,
	radius: 3,
	mass: 4,
	drag: 16,
	elasticity: 2,
	
	// collision values
	predatorValue: 0.0,
	preyValue: -0.334,
	foodValue: 0.0,
}

const settings = {
	scenario,
	replicator,
	predator,
	prey,
	food,
}

const defaultSettings = {}

for ( const key of Object.keys( settings ) ) {
	defaultSettings[ key ] = { ...settings[ key ] }
}

export default settings
export { defaultSettings }
