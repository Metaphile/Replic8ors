import World from './world'
import Replic8or from './replic8or'
import Vector2 from '../engine/vector-2'
import settings from '../settings/settings'

const precision = 9

const Prey = ( customSettings: any = {} ) => Replic8or( { ...settings.prey, ...customSettings } )

describe( 'world', () => {
	it( 'preys can be added', () => {
		const world = World()
		
		const prey = Prey()
		world.addPrey( prey )
		
		expect( world.greens.includes( prey ) ).toBe( true )
	} )
	
	it( 'removes dead preys', () => {
		const world = World()
		
		const prey = Prey()
		world.addPrey( prey )
		prey.die()
		
		expect( world.greens.length ).toBe( 0 )
	} )
	
	it( 'moves partially overlapping preys apart', () => {
		const world = World()
		
		const preyOpts = {
			radius:     64,
			energy:     0.5,
			metabolism: 0,
			mass:       10,
			drag:       1,
		}
		
		// position two preys so that they're overlapping horizontally
		
		const lefty = Prey( preyOpts )
		lefty.position.x = -10
		
		const righty = Prey( preyOpts )
		righty.position.x = 10
		
		world.addPrey( lefty )
		world.addPrey( righty )
		
		world.update( 1/60, 1/60 )
		
		// expect lefty to be lefter, righty to be righter
		expect( lefty.position.x  < -10 ).toBe( true )
		expect( righty.position.x >  10 ).toBe( true )
	} )
	
	it( 'moves completely overlapping preys apart', () => {
		const world = World()
		
		const preyOpts = {
			radius:     64,
			energy:     0.5,
			metabolism: 0,
			mass:       10,
			drag:       1,
		}
		
		// position two preys so that they're directly on top of each other
		
		const bottom = Prey( preyOpts )
		const top    = Prey( preyOpts )
		
		world.addPrey( bottom )
		world.addPrey( top )
		
		world.update( 1/60, 1/60 )
		
		const error = Math.pow( 10, -precision )
		
		expect( Vector2.getLength( top.position ) > error ).toBe( true )
		expect( Vector2.getLength( bottom.position ) > error ).toBe( true )
		// TODO make sure preys moved in opposite directions
	} )
	
	describe( 'emits events', () => {
		it( 'replicator added', () => {
			const world = World()
			
			const spy = jasmine.createSpy()
			world.on( 'replicator-added', spy )
			
			const replicator = Prey()
			world.addPrey( replicator )
			
			expect( spy ).toHaveBeenCalledWith( replicator )
		} )
		
		it( 'replicator died', () => {
			const world = World()
			
			const spy = jasmine.createSpy()
			world.on( 'replicator-died', spy )
			
			const doomedReplicator = Prey()
			world.addPrey( doomedReplicator )
			doomedReplicator.die()
			
			expect( spy ).toHaveBeenCalledWith( doomedReplicator )
		} )
	} )
} )
