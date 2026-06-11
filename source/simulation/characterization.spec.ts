// @ts-nocheck — TODO Phase 3 ratchet: type this file and remove
// Characterization (golden-master) test for the simulation.
//
// This is the behavior oracle for the modernization + functional port. It runs
// the *current* prototype-based simulation with a seeded RNG and snapshots a
// digest of world state at fixed checkpoints. Any change to simulation logic
// (JS->TS conversion, the functional port) must reproduce this snapshot, OR the
// divergence must be a deliberate, documented decision (then re-baseline).
//
// Determinism relies on Math2.setRng() routing every random source in the sim
// (replic8or weights/mutation, scenario placement, physics overlap-nudge).

import { setRng } from '../engine/math-2'
import World from './world'
import Scenario from './scenario'

// mulberry32 — tiny seeded PRNG, deterministic across platforms.
function mulberry32( seed: number ): () => number {
	let a = seed >>> 0
	return () => {
		a |= 0
		a = ( a + 0x6D2B79F5 ) | 0
		let t = Math.imul( a ^ ( a >>> 15 ), 1 | a )
		t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t
		return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296
	}
}

const round = ( x: number, places = 4 ): number => {
	if ( !Number.isFinite( x ) ) return x
	const f = 10 ** places
	return Math.round( x * f ) / f
}

type Replicator = any

function replicatorDigest( r: Replicator ) {
	return {
		type: r.type,
		pos: [ round( r.position.x, 2 ), round( r.position.y, 2 ) ],
		vel: [ round( r.velocity.x, 2 ), round( r.velocity.y, 2 ) ],
		rotation: round( r.rotation ),
		energy: round( r.energy ),
		age: round( r.age ),
		// neuron potentials capture the brain's internal state precisely
		potentials: r.brain.neurons.map( ( n: any ) => round( n.potential ) ),
		firing: r.brain.neurons.map( ( n: any ) => n.firing ),
	}
}

function worldDigest( world: any ) {
	const all = [ ...world.reds, ...world.greens, ...world.blues ]
	return {
		counts: { reds: world.reds.length, greens: world.greens.length, blues: world.blues.length },
		totalEnergy: round( all.reduce( ( s: number, r: any ) => s + r.energy, 0 ) ),
		replicators: all.map( replicatorDigest ),
	}
}

describe( 'simulation characterization', () => {
	it( 'reproduces a deterministic run', () => {
		setRng( mulberry32( 0x5eed ) )

		const world = World()
		// small, fixed populations so the digest stays readable but still
		// exercises predator/prey/blue sensing, collisions and energy transfer.
		const scenario = Scenario( world, {
			minReds: 2, maxReds: 2,
			minGreens: 2, maxGreens: 2,
			minBlues: 2, maxBlues: 2,
		} )

		const dt = 1 / 30
		const checkpoints = [ 1, 30, 90, 300 ]
		const digests: Record<number, unknown> = {}

		let maxTick = Math.max( ...checkpoints )
		for ( let tick = 1; tick <= maxTick; tick++ ) {
			scenario.update( dt )
			if ( checkpoints.includes( tick ) ) {
				digests[ tick ] = worldDigest( world )
			}
		}

		expect( digests ).toMatchSnapshot()

		// restore production RNG for any subsequent tests in the same worker
		setRng( Math.random )
	} )
} )
