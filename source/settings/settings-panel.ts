import * as $ from 'jquery'
import * as helpers from './settings-panel-helpers'
import settingsPanelTemplate from './settings-panel.ejs'
import settings, { defaultSettings } from './settings'

export default function SettingsPanel() {
	const predatorFields = []
	const preyFields = []
	const blueFields = []
	
	const replicatorFieldDefs = [
		{
			section: 'PLACEHOLDER',
			settingsKey: 'radius',
			fieldLabel: 'Size',
			step: 1,
			rangeInputMinValue: 16,
			rangeInputMaxValue: 96,
			validator: helpers.isPositiveFloat,
		},
		{
			section: 'PLACEHOLDER',
			settingsKey: 'mass',
			fieldLabel: 'Mass',
			step: 1,
			rangeInputMinValue: 1,
			rangeInputMaxValue: 512,
			validator: helpers.isPositiveFloat,
		},
		{
			section: 'PLACEHOLDER',
			settingsKey: 'metabolism',
			fieldLabel: 'Metabolism',
			step: 0.001,
			rangeInputMinValue: -0.5,
			rangeInputMaxValue: 0.5,
			validator: helpers.isFloat,
		},
		{
			section: 'PLACEHOLDER',
			settingsKey: 'potentialDecayRate',
			fieldLabel: 'Neuron Potential Decay',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isNormalizedFloat,
		},
	]
	
	const predatorFieldDefs = [
		...replicatorFieldDefs.map( fieldDef => (
			{
				...fieldDef,
				section: 'predator',
			}
		) ),
		{
			section: 'scenario',
			settingsKey: 'minReds',
			fieldLabel: 'Min Population',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 32,
			validator: helpers.isNonNegativeInt,
		},
		{
			section: 'scenario',
			settingsKey: 'maxReds',
			fieldLabel: 'Max Population',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 32,
			validator: helpers.isNonNegativeInt,
		},
		{
			section: undefined,
			fieldLabel: 'Collision Values',
		},
		{
			section: 'predator',
			settingsKey: 'predatorValue',
			fieldLabel: 'Reds',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'predator',
			settingsKey: 'preyValue',
			fieldLabel: 'Greens',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'predator',
			settingsKey: 'blueValue',
			fieldLabel: 'Blues',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
	]
	
	const preyFieldDefs = [
		...replicatorFieldDefs.map( fieldDef => (
			{
				...fieldDef,
				section: 'prey',
			}
		) ),
		{
			section: 'scenario',
			settingsKey: 'minGreens',
			fieldLabel: 'Min Population',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 32,
			validator: helpers.isNonNegativeInt,
		},
		{
			section: 'scenario',
			settingsKey: 'maxGreens',
			fieldLabel: 'Max Population',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 32,
			validator: helpers.isNonNegativeInt,
		},
		{
			section: undefined,
			fieldLabel: 'Collision Values',
		},
		{
			section: 'prey',
			settingsKey: 'predatorValue',
			fieldLabel: 'Reds',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'prey',
			settingsKey: 'preyValue',
			fieldLabel: 'Greens',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'prey',
			settingsKey: 'blueValue',
			fieldLabel: 'Blues',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
	]
	
	const blueFieldDefs = [
		...replicatorFieldDefs.map( fieldDef => (
			{
				...fieldDef,
				section: 'blue',
			}
		) ),
		{
			section: 'scenario',
			settingsKey: 'minBlues',
			fieldLabel: 'Min Population',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 32,
			validator: helpers.isNonNegativeInt,
		},
		{
			section: 'scenario',
			settingsKey: 'maxBlues',
			fieldLabel: 'Max Population',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 32,
			validator: helpers.isNonNegativeInt,
		},
		{
			section: undefined,
			fieldLabel: 'Collision Values',
		},
		{
			section: 'blue',
			settingsKey: 'predatorValue',
			fieldLabel: 'Reds',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'blue',
			settingsKey: 'preyValue',
			fieldLabel: 'Greens',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'blue',
			settingsKey: 'blueValue',
			fieldLabel: 'Blues',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
	]
	
	for ( const fieldDef of predatorFieldDefs ) {
		if ( fieldDef.section ) {
			predatorFields.push( helpers.populateFieldTemplate(
				fieldDef,
				settings,
				defaultSettings,
			) )
		} else {
			predatorFields.push( `<h3>${ fieldDef.fieldLabel }</h3>` )
		}
	}
	
	for ( const fieldDef of preyFieldDefs ) {
		if ( fieldDef.section ) {
			preyFields.push( helpers.populateFieldTemplate(
				fieldDef,
				settings,
				defaultSettings,
			) )
		} else {
			preyFields.push( `<h3>${ fieldDef.fieldLabel }</h3>` )
		}
	}
	
	for ( const fieldDef of blueFieldDefs ) {
		if ( fieldDef.section ) {
			blueFields.push( helpers.populateFieldTemplate(
				fieldDef,
				settings,
				defaultSettings,
			) )
		} else {
			blueFields.push( `<h3>${ fieldDef.fieldLabel }</h3>` )
		}
	}
	
	const $element = $( settingsPanelTemplate( {
		predatorFields,
		preyFields,
		blueFields,
	} ) )
	
	for ( const fieldDef of [ ...predatorFieldDefs, ...preyFieldDefs, ...blueFieldDefs ] ) {
		if ( fieldDef.section ) {
			helpers.attachInputHandler( fieldDef, $element )
		}
	}
	
	return {
		$element,
	}
}
