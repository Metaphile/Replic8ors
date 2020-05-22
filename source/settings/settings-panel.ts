import * as $ from 'jquery'
import * as helpers from './settings-panel-helpers'
import settingsPanelTemplate from './settings-panel.ejs'
import settings, { defaultSettings, setSetting } from './settings'

const tryLoadSettings = () => {
	try {
		const storedSettings = JSON.parse( localStorage.getItem( 'settings' ) )
		
		for ( const section in storedSettings ) {
			for ( const key in storedSettings[ section ] ) {
				setSetting( section, key, storedSettings[ section ][ key ] )
			}
		}
	} catch ( e ) {
		console.log( 'failed to load settings', e )
	}
}

export default function SettingsPanel() {
	const predatorFields = []
	const preyFields = []
	const blueFields = []
	
	tryLoadSettings()
	
	const replicatorFieldDefs1 = [
		{
			section: 'PLACEHOLDER',
			settingsKey: 'radius',
			fieldLabel: 'Size',
			description: 'Radius',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 96,
			validator: helpers.isPositiveFloat,
		},
		{
			section: 'PLACEHOLDER',
			settingsKey: 'mass',
			fieldLabel: 'Mass',
			description: 'Mass',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 512,
			validator: helpers.isPositiveFloat,
		},
		{
			fieldLabel: undefined,
		},
		{
			section: 'PLACEHOLDER',
			settingsKey: 'predatorValue',
			fieldLabel: 'Red Calories',
			description: 'Energy gained/lost from bumping into red replicators',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'PLACEHOLDER',
			settingsKey: 'preyValue',
			fieldLabel: 'Green Calories',
			description: 'Energy gained/lost from bumping into green replicators',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'PLACEHOLDER',
			settingsKey: 'blueValue',
			fieldLabel: 'Blue Calories',
			description: 'Energy gained/lost from bumping into blue replicators',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			fieldLabel: undefined,
		},
		{
			section: 'PLACEHOLDER',
			settingsKey: 'metabolism',
			fieldLabel: 'Metabolism',
			description: 'Energy cost per second to remain alive',
			step: 0.001,
			rangeInputMinValue: -0.5,
			rangeInputMaxValue: 0.5,
			validator: helpers.isFloat,
		},
	]
	
	const replicatorFieldDefs2 = [
		{
			section: 'PLACEHOLDER',
			settingsKey: 'potentialDecayRate',
			fieldLabel: 'Neuron Decay',
			description: 'How quickly neurons lose accumulated potential',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isNormalizedFloat,
		},
	]
	
	const minReplicatorsFieldDef = {
		section: 'scenario',
		settingsKey: 'PLACEHOLDER',
		fieldLabel: 'Min Population',
		description: 'If the population falls below this number, clones of past members will be added (max population takes precedence)',
		step: 1,
		rangeInputMinValue: 0,
		rangeInputMaxValue: 32,
		validator: helpers.isNonNegativeInt,
	}
	
	const maxReplicatorsFieldDef = {
		section: 'scenario',
		settingsKey: 'PLACEHOLDER',
		fieldLabel: 'Max Population',
		description: 'If the population exceeds this number, the oldest members will be removed',
		step: 1,
		rangeInputMinValue: 0,
		rangeInputMaxValue: 32,
		validator: helpers.isNonNegativeInt,
	}
	
	const predatorFieldDefs = [
		{
			fieldLabel: undefined,
		},
		...replicatorFieldDefs1.map( fieldDef => (
			{
				...fieldDef,
				section: 'predator',
			}
		) ),
		{
			fieldLabel: undefined,
		},
		{
			...minReplicatorsFieldDef,
			settingsKey: 'minReds',
		},
		{
			...maxReplicatorsFieldDef,
			settingsKey: 'maxReds',
		},
		{
			fieldLabel: undefined,
		},
		...replicatorFieldDefs2.map( fieldDef => (
			{
				...fieldDef,
				section: 'predator',
			}
		) ),
	]
	
	const preyFieldDefs = [
		{
			fieldLabel: undefined,
		},
		...replicatorFieldDefs1.map( fieldDef => (
			{
				...fieldDef,
				section: 'prey',
			}
		) ),
		{
			fieldLabel: undefined,
		},
		{
			...minReplicatorsFieldDef,
			settingsKey: 'minGreens',
		},
		{
			...maxReplicatorsFieldDef,
			settingsKey: 'maxGreens',
		},
		{
			fieldLabel: undefined,
		},
		...replicatorFieldDefs2.map( fieldDef => (
			{
				...fieldDef,
				section: 'prey',
			}
		) ),
	]
	
	const blueFieldDefs = [
		{
			fieldLabel: undefined,
		},
		...replicatorFieldDefs1.map( fieldDef => (
			{
				...fieldDef,
				section: 'blue',
			}
		) ),
		{
			fieldLabel: undefined,
		},
		{
			...minReplicatorsFieldDef,
			settingsKey: 'minBlues',
		},
		{
			...maxReplicatorsFieldDef,
			settingsKey: 'maxBlues',
		},
		{
			fieldLabel: undefined,
		},
		...replicatorFieldDefs2.map( fieldDef => (
			{
				...fieldDef,
				section: 'blue',
			}
		) ),
	]
	
	for ( const fieldDef of predatorFieldDefs ) {
		if ( fieldDef.fieldLabel ) {
			predatorFields.push( helpers.populateFieldTemplate(
				fieldDef,
				settings,
				defaultSettings,
			) )
		} else {
			predatorFields.push( '<hr>' )
		}
	}
	
	for ( const fieldDef of preyFieldDefs ) {
		if ( fieldDef.fieldLabel ) {
			preyFields.push( helpers.populateFieldTemplate(
				fieldDef,
				settings,
				defaultSettings,
			) )
		} else {
			preyFields.push( '<hr>' )
		}
	}
	
	for ( const fieldDef of blueFieldDefs ) {
		if ( fieldDef.fieldLabel ) {
			blueFields.push( helpers.populateFieldTemplate(
				fieldDef,
				settings,
				defaultSettings,
			) )
		} else {
			blueFields.push( '<hr>' )
		}
	}
	
	const $element = $( settingsPanelTemplate( {
		predatorFields,
		preyFields,
		blueFields,
	} ) )
	
	for ( const fieldDef of [ ...predatorFieldDefs, ...preyFieldDefs, ...blueFieldDefs ] ) {
		if ( fieldDef.fieldLabel ) {
			helpers.attachInputHandler( fieldDef, $element )
		}
	}
	
	$( 'input[type=number]', $element ).focus( function () {
		$( this ).select()
	} )
	
	return {
		$element,
	}
}
