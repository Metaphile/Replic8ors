export type Clamp = ( value: number, min: number, max: number ) => number
export type CreateRandRange = ( rng: Rng ) => RandRange
export type RandRange = ( min: number, max: number ) => number
export type Rng = () => number // 0..1

export const TAU = Math.PI * 2 // tauday.com

export const createRandRange: CreateRandRange = ( rng ) => {
  return ( min, max ) => {
    return min + ( rng() * ( max - min ) )
  }
}

export const randRange: RandRange = createRandRange( Math.random )

export const clamp: Clamp = ( value, min, max ) => {
  if ( value < min ) {
    return min
  } else if ( value > max ) {
    return max
  } else {
    return value
  }
}
