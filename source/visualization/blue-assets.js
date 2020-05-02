import {
	DamageEffect,
	DeathEffect,
	EnergyUpEffectFactory,
	SpawnEffect,
	backsideGradient,
	ctx,
	face,
} from './replicator-assets'

const energyGradient = ( () => {
	// we want a crisp edge between the black and transparent color stops
	// we can achieve this by positioning the stops on top of each other
	// but the effect doesn't work at 0.0 or 1.0
	// we get around this by defining the gradient from y = -1 to 1, and putting the overlapping stops in the middle
	
	const gradient = ctx.createLinearGradient( 0, -1, 0, 1 )
	
	gradient.addColorStop( 0.500, 'rgba(   0,  14,  61, 0.00 )' )
	gradient.addColorStop( 0.500, 'rgba(  20, 144, 206, 0.60 )' )
	gradient.addColorStop( 0.504, 'rgba(   0,  14,  61, 0.85 )' )
	gradient.addColorStop( 1.000, 'rgba(   0,  14,  61, 1.00 )' )
	
	return gradient
} )()

const energyUpGradient = ( () => {
	const gradient = ctx.createLinearGradient( 0, -1, 0, 1 )
	
	gradient.addColorStop( 0.0, 'rgba(   0, 127, 255, 0.0 )' )
	gradient.addColorStop( 0.5, 'rgba(   0, 127, 255, 0.3 )' )
	gradient.addColorStop( 0.5, 'rgba(   0, 127, 255, 0.8 )' )
	gradient.addColorStop( 1.0, 'rgba(   0, 127, 255, 0.2 )' )
	
	return gradient
} )()

const EnergyUpEffect = EnergyUpEffectFactory( energyUpGradient )

const skinColor = 'rgba( 0, 0, 23, 0.6 )'

export {
	DamageEffect,
	DeathEffect,
	EnergyUpEffect,
	SpawnEffect,
	backsideGradient,
	energyGradient,
	face,
	skinColor,
}
