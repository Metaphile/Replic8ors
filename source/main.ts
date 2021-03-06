// -------------------------------------------------------------------------- //
//                                                                            //
//                                          eeeee                             //
//         eeeee  eeee eeeee e     e  eeee  8   8  eeeee eeeee  eeeee         //
//         8   8  8    8   8 8     8  8  8  8eee8  8  88 8   8  8   "         //
//         8eee8e 8eee 8eee8 8e    8e 8e   88   88 8   8 8eee8e 8eeee         //
//         88   8 88   88    88    88 88   88   88 8   8 88   8    88         //
//         88   8 88ee 88    88eee 88 88e8 88eee88 8eee8 88   8 8ee88         //
//                                                                            //
//                                                                            //
// -------------------------------------------------------------------------- //

import '@babel/polyfill'
import './main.scss'
import * as $ from 'jquery'
import World from './simulation/world'
import Scenario from './simulation/scenario'
import Visualization from './visualization/visualization'
import GameLoop from './engine/game-loop'
import ControlBar from './control-bar/control-bar'

const CURRENT_VERSION = '2.0'

// on DOM ready
$( () => {
	$( '#version-number' ).html( CURRENT_VERSION )
	
	// create empty world for replicators and other entities to inhabit
	// world updates entities, mediates interactions, emits events
	const world = World()
	
	// set up and monitor experimental scenario
	// (add replicators, subscribe to events, etc.)
	const scenario = Scenario( world )
	
	// drive scenario/world
	
	const scenarioLoop = ( () => {
		const update = ( dt, t ) => scenario.update( dt, t )
		const draw = () => {}
		const opts = {
			timestep: 1/30,
		}
		
		return GameLoop( update, draw, opts )
	} )()
	
	const visualization = Visualization( world )
	$( '#visualization' ).append( visualization.$element )
	// initialize dimensions
	visualization.$element.trigger( 'appended' )
	
	// drive visualization
	const visualizationLoop = GameLoop(
		dt => visualization.update( dt, dt * ( scenarioLoop.paused ? 0 : scenarioLoop.timescale ) ),
		() => visualization.draw( 0 ) )
	
	scenarioLoop.on( 'step', dt => {
		visualization.update( dt, dt )
	} )
	
	const controlBar = ControlBar( scenarioLoop, visualization )
	$( '#control-bar' ).append( controlBar.$element )
} )

// prevent accidental navigation, except on localhost
$( window ).on( 'beforeunload', () => {
	if ( location.host !== 'localhost:8080' ) return ''
})
