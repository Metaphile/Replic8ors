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
		{
			section: undefined,
			fieldLabel: 'Collision Values',
		},
		{
			section: 'predator',
			settingsKey: 'predatorValue',
			fieldLabel: 'Other Black Replicators',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'predator',
			settingsKey: 'preyValue',
			fieldLabel: 'White Replicators',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'predator',
			settingsKey: 'foodValue',
			fieldLabel: 'Food Particles',
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
			settingsKey: 'maxPreys',
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
			fieldLabel: 'Black Replicators',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'prey',
			settingsKey: 'preyValue',
			fieldLabel: 'Other White Replicators',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'prey',
			settingsKey: 'foodValue',
			fieldLabel: 'Food Particles',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
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
		{
			section: undefined,
			fieldLabel: 'Collision Values',
		},
		{
			section: 'food',
			settingsKey: 'predatorValue',
			fieldLabel: 'Black Replicators',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'food',
			settingsKey: 'preyValue',
			fieldLabel: 'White Replicators',
			step: 0.001,
			rangeInputMinValue: -1,
			rangeInputMaxValue: 1,
			validator: helpers.isFloat,
		},
		{
			section: 'food',
			settingsKey: 'foodValue',
			fieldLabel: 'Other Food Particles',
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
	
	for ( const fieldDef of foodFieldDefs ) {
		if ( fieldDef.section ) {
			foodFields.push( helpers.populateFieldTemplate(
				fieldDef,
				settings,
				defaultSettings,
			) )
		} else {
			foodFields.push( `<h3>${ fieldDef.fieldLabel }</h3>` )
		}
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
