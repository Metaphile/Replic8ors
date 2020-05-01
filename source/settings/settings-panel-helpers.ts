import * as $ from 'jquery'
import settingsPanelFieldTemplate from './settings-panel-field.ejs'
import { setSetting } from './settings'

export function round( number, precision = 3 ) {
	number *= Math.pow( 10, precision )
	number = Math.round( number )
	number /= Math.pow( 10, precision )
	
	return number
}

export function isFloat( stringValue: string ): boolean {
	const floatValue = parseFloat( stringValue )
	return !isNaN( floatValue )
}

export function isNonZeroFloat( stringValue: string ): boolean {
	if ( !isFloat( stringValue ) ) {
		return false
	}
	
	const floatValue = parseFloat( stringValue )
	return floatValue !== 0
}

export function isPositiveFloat( stringValue: string ): boolean {
	if ( !isFloat( stringValue ) ) {
		return false
	}
	
	const floatValue = parseFloat( stringValue )
	return floatValue > 0
}

export function isNonNegativeFloat( stringValue: string ): boolean {
	if ( !isFloat( stringValue ) ) {
		return false
	}
	
	const floatValue = parseFloat( stringValue )
	return floatValue >= 0
}

export function isNonNegativeInt( stringValue: string ): boolean {
	const intValue = parseInt( stringValue )
	return !isNaN( intValue ) && intValue >= 0
}

export function isNormalizedFloat( stringValue: string ): boolean {
	if ( !isFloat( stringValue ) ) {
		return false
	}
	
	const floatValue = parseFloat( stringValue )
	return floatValue >= -1 && floatValue <= 1
}

export function populateFieldTemplate( fieldDef, settings, defaultSettings ) {
	return settingsPanelFieldTemplate( {
		...fieldDef,
		
		inputName: `${ fieldDef.section }_${ fieldDef.settingsKey }`,
		value: round( settings[ fieldDef.section ][ fieldDef.settingsKey ] ),
		datalistId: `${ fieldDef.section }_${ fieldDef.settingsKey }_default`,
		defaultValue: round( defaultSettings[ fieldDef.section ][ fieldDef.settingsKey ] ),
	} )
}

export function attachInputHandler( fieldDef, $element ) {
	const inputSelector       = `[name=${ fieldDef.section }_${ fieldDef.settingsKey }]`
	const numberInputSelector = `${ inputSelector }[type=number]`
	const rangeInputSelector  = `${ inputSelector }[type=range]`
	
	function applyValue( otherInputSelector ) {
		return function () {
			const $self = $( this )
			const $other = $( otherInputSelector )
			
			if ( !fieldDef.validator( <string>$self.val() ) ) {
				$self.addClass( 'invalid' )
				$other.addClass( 'invalid' )
				
				return
			} else {
				$self.removeClass( 'invalid' )
				$other.removeClass( 'invalid' )
			}
			
			const value = round( $self.val() )
			
			setSetting( fieldDef.section, fieldDef.settingsKey, value )
			
			$other.val( value )
		}
	}
	
	$( numberInputSelector, $element ).on( 'change', applyValue( rangeInputSelector ) )
	$( rangeInputSelector, $element ).on( 'input', applyValue( numberInputSelector ) )
}
