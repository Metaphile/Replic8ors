import * as $ from 'jquery'
import * as helpers from './settings-panel-helpers'
import settingsPanelTemplate from './settings-panel.ejs'
import settings, { defaultSettings } from './settings'

export default function SettingsPanel() {
	const predatorFields = []
	const preyFields = []
	const foodFields = []
	
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
			settingsKey: 'maxPredators',
			fieldLabel: 'Max Population',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 32,
			validator: helpers.isNonNegativeInt,
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
			settingsKey: 'maxPreys',
			fieldLabel: 'Max Population',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 32,
			validator: helpers.isNonNegativeInt,
		},
	]
	
	const foodFieldDefs = [
		{
			section: 'food',
			settingsKey: 'radius',
			fieldLabel: 'Size',
			step: 1,
			rangeInputMinValue: 1,
			rangeInputMaxValue: 16,
			validator: helpers.isPositiveFloat,
		},
		{
			section: 'food',
			settingsKey: 'shelfLife',
			fieldLabel: 'Lifespan',
			step: 1,
			rangeInputMinValue: 1,
			rangeInputMaxValue: 600,
			validator: helpers.isNonNegativeFloat,
		},
		{
			section: 'scenario',
			settingsKey: 'maxFoods',
			fieldLabel: 'Max Food Particles',
			step: 1,
			rangeInputMinValue: 0,
			rangeInputMaxValue: 256,
			validator: helpers.isNonNegativeInt,
		},
	]
	
	for ( const fieldDef of predatorFieldDefs ) {
		predatorFields.push( helpers.populateFieldTemplate(
			fieldDef,
			settings,
			defaultSettings,
		) )
	}
	
	for ( const fieldDef of preyFieldDefs ) {
		preyFields.push( helpers.populateFieldTemplate(
			fieldDef,
			settings,
			defaultSettings,
		) )
	}
	
	for ( const fieldDef of foodFieldDefs ) {
		foodFields.push( helpers.populateFieldTemplate(
			fieldDef,
			settings,
			defaultSettings,
		) )
	}
	
	const $element = $( settingsPanelTemplate( {
		predatorFields,
		preyFields,
		foodFields,
	} ) )
	
	for ( const fieldDef of [ ...predatorFieldDefs, ...preyFieldDefs, ...foodFieldDefs ] ) {
		if ( fieldDef.section ) {
			helpers.attachInputHandler( fieldDef, $element )
		}
	}
	
	return {
		$element,
	}
}
