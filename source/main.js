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

import $ from '../third-party/jquery'
import World from './simulation/world'
import Scenario from './simulation/scenario'
import Visualization from './visualization/visualization'
import GameLoop from './engine/game-loop'
import PlayControls from './play-controls'

// TODO precision -> epsilon?
// TODO assign defaultOpts to prototypes

// TODO visualization depends on world, scenario
// subscribes to scenario "fail" event
// soft-resets scenario a few seconds after a fail

// TODO energy cost per neuron activation?
// energy cost per flagellum activation?
// indicate with subtle animation of stomach juice
// "zombie" replicators may not be as big of a problem with the new setup
// if so, maybe a linear metabolism would be sufficient

// TODO buttons to add/remove predators
// because I think introducing predators at the very start would be a slaughter
// but if I don't do that then I need logic to add predators at the right time, whenever that is
// predators that have been added should persist between (soft?) resets

// on DOM ready
$( () => {
	// create empty world for replicators and other entities to inhabit
	// world updates entities, mediates interactions, emits events
	const world = World()
	
	// set up and monitor experimental scenario
	// (add replicators, subscribe to events, etc.)
	const scenario = Scenario( world )
	
	// drive scenario/world
	const scenarioLoop = GameLoop(
		( dt, t ) => scenario.update( dt, t ),
		() => {} )
	
	const visualization = Visualization( world )
	$( '#visualization' ).append( visualization.$element )
	// initialize dimensions
	visualization.$element.trigger( 'appended' )
	
	// drive visualization
	const visualizationLoop = GameLoop(
		dt => visualization.update( dt, dt * ( scenarioLoop.paused ? 0 : scenarioLoop.timescale ) ),
		() => visualization.draw( 0 ) )
	
	scenarioLoop.on( 'step', dt => {
		// TODO scale dt2 parameter?
		visualization.update( dt, dt )
	} )
	
	const controls = PlayControls( scenarioLoop )
	
	$( '#play-controls' ).append( controls )
} )

// on when to use arrow functions vs regular:
// http://stackoverflow.com/a/23045200/40356
