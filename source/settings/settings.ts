export const scenarioSettings = {
	maxPredators: 11,
	maxPreys: 13,
	maxFoods: 21,
}

export const replicatorSettings = {
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
}

export const predatorSettings = {
	...replicatorSettings,
}

export const preySettings = {
	...replicatorSettings,
}

export const foodSettings = {
	calories: 0.7,
	shelfLife: 5 * 60,
	radius: 2.7,
	mass: 4,
	drag: 16,
	elasticity: 2,
}
