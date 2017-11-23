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

import 'babel-polyfill'
import './main.scss'
import $ from '../third-party/jquery'
import World from './simulation/world'
import Scenario from './simulation/scenario'
import Visualization from './visualization/visualization'
import GameLoop from './engine/game-loop'
import PlayControls from './play-controls'

// display version number on document ready
// REMEMBER TO INCREMENT AS NECESSARY
$( () => $( '#version-number' ).html( '1.1' ) )

// TODO copy-webpack-plugin?
// TODO add htaccess file to redirect to HTTPS
// https://help.dreamhost.com/hc/en-us/articles/215747758-How-do-I-force-my-site-to-load-securely-with-an-htaccess-file-
// TODO update screenshot

// TODO Save Genome button adds history item and updates URL without page load

// TODO replicator death animation
// each component of replicator scales up and fades out
// effect moves accross replicator (esp neuron) away from direction of predator
// or outward from center if death from starvation

// TODO assign defaultOpts to prototypes

// TODO dt, dt2 -> dt_real, dt_sim

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

// TODO turn scenario into controller that contains model and visualization
// visualization subscribes to model events
// but also controller can call visualization methods
// edit: Presentation-Abstraction-Control

// MAYBE pain neuron, 

// on DOM ready
$( () => {
	// create empty world for replicators and other entities to inhabit
	// world updates entities, mediates interactions, emits events
	const world = World()
	
	// set up and monitor experimental scenario
	// (add replicators, subscribe to events, etc.)
	const scenario = Scenario( world )
	
	// drive scenario/world
	// MAYBE time object
	// e.g., time = { sim: 0.016, real: 0.017, simTotal: 123.456, realTotal: 124.567 }
	// only need one instance; update between frames
	const scenarioLoop = GameLoop(
		( dt, t ) => scenario.update( dt, t ),
		() => {} )
	
	const visualization = Visualization( world )
	$( '#visualization' ).append( visualization.$element )
	// initialize dimensions
	visualization.$element.trigger( 'appended' )
	
	let yesDraw = true;
	
	// drive visualization
	const visualizationLoop = GameLoop(
		dt => visualization.update( dt, dt * ( scenarioLoop.paused ? 0 : scenarioLoop.timescale ) ),
		() => yesDraw && visualization.draw( 0 ) )
	
	// MAYBE 'updated' event from world?
	scenarioLoop.on( 'step', dt => {
		// TODO scale dt2 parameter?
		visualization.update( dt, dt )
	} )
	
	function onToggleOffline( toggleState ) {
		yesDraw = toggleState
	}
	const controls = PlayControls( scenarioLoop, onToggleOffline )
	
	$( '#play-controls' ).append( controls )
	
	// show info box on first load
	{
		const cookieName = 'hideInfo';
		const cookieValue = '1';
		
		// adapted from https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
		const magic = new RegExp( '(?:(?:^|.*;\s*)' + cookieName + '\s*\=\s*([^;]*).*$)|^.*$' )
		const cookieIsSet = ( document.cookie.replace( magic, '$1' ) === cookieValue )
		
		if ( !cookieIsSet ) {
			// no cookie? show info box
			$( '#info' ).fadeIn()
			
			// set cookie so info box isn't shown automatically next time
			document.cookie = `${cookieName}=${cookieValue}; expires=Fri, 31 Dec 9999 23:59:59 GMT`
		}
	}
} )

// prevent accidental navigation
$( window ).on( 'beforeunload', () => {
	return "Progress can't be saved. Are you sure?";
});

// on when to use arrow functions vs regular:
// http://stackoverflow.com/a/23045200/40356
