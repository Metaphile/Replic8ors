import * as Math2 from './math-2'

describe( 'math 2', () => {
  describe( 'randRange', () => {
    it( 'returns min value', () => {
      const randRange = Math2.createRandRange( () => 1 )
      expect( randRange( -3, 7 ) ).toBe( 7 )
    } )

    it( 'returns max value', () => {
      const randRange = Math2.createRandRange( () => 0 )
      expect( randRange( -3, 7 ) ).toBe( -3 )
    } )
  } )

  describe( 'clamp', () => {
    it( 'clamps to min', () => {
      expect( Math2.clamp( -2, -1, 1 ) ).toBe( -1 )
    } )

    it( 'clamps to max', () => {
      expect( Math2.clamp( 2, -1, 1 ) ).toBe( 1 )
    } )

    it( 'does not clamp value in range', () => {
      expect( Math2.clamp( 0.5, -1, 1 ) ).toBe( 0.5 )
    } )
  } )
} )
