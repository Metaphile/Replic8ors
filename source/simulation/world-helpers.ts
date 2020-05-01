export function forEachUniquePair( items: any[], operation ) {
	for ( let i = 0, n = items.length; i < n; i++ ) {
		const item_i = items[ i ]
		for ( let j = i + 1; j < n; j++ ) {
			operation( item_i, items[ j ] )
		}
	}
}

export function areCloserThan( a, b, distance ) {
	const dx = b.position.x - a.position.x
	const dy = b.position.y - a.position.y
	
	const r1 = b.radius
	const r2 = a.radius
	
	const actual  = ( dx * dx ) + ( dy * dy ) // center to center
	const minimum = ( r1 + r2 + distance ) * ( r1 + r2 + distance )
	
	return actual < minimum
}

function getNewItems( previousItems, currentItems ) {
	return currentItems.filter( currentItem => !previousItems.includes( currentItem ) )
}

export function getNewColliders( entity ) {
	return getNewItems( entity.previousColliders, entity.currentColliders )
}

function doTransferEnergy( a, b ) {
	const change = a[ `${ b.type }Value` ]
	
	a.energy += change
	
	if ( change > 0 ) {
		a.emit( 'gained-energy' )
	} else if ( change < 0 ) {
		a.emit( 'lost-energy' )
	}
}

export function transferEnergyBetween( a, b ) {
	if ( a.energy > 0 && b.energy > 0 ) {
		doTransferEnergy( a, b )
		doTransferEnergy( b, a )
	}
}
