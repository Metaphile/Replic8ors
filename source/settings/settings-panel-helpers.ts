// @ts-nocheck — TODO Phase 3 ratchet: type this file and remove
import { fieldTemplate as settingsPanelFieldTemplate } from './settings-panel-templates'
import settings, { setSetting, defaultSettings } from './settings'
import { debounce } from '../helpers'

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

const storeSettings = debounce( () => {
	localStorage.setItem( 'settings', JSON.stringify( settings ) )
}, 250 )

export function attachInputHandler( fieldDef, element ) {
	const inputSelector       = `[name=${ fieldDef.section }_${ fieldDef.settingsKey }]`
	const numberInputSelector = `${ inputSelector }[type=number]`
	const rangeInputSelector  = `${ inputSelector }[type=range]`

	function applyValue( otherInputSelector ) {
		return function () {
			const self = this
			// names are unique per field, so a document-wide lookup matches the
			// original jQuery behavior (which wasn't scoped to the panel either).
			const other = document.querySelector( otherInputSelector )

			const label = self.closest( 'label' )
			if ( self.value != defaultSettings[ fieldDef.section ][ fieldDef.settingsKey ] ) {
				label && label.classList.add( 'modified' )
			} else {
				label && label.classList.remove( 'modified' )
			}

			const value = round( self.value )
			if ( other ) other.value = value

			if ( !fieldDef.validator( self.value ) ) {
				self.classList.add( 'invalid' )
				other && other.classList.add( 'invalid' )
			} else {
				self.classList.remove( 'invalid' )
				other && other.classList.remove( 'invalid' )

				setSetting( fieldDef.section, fieldDef.settingsKey, value )
				storeSettings()
			}
		}
	}

	element.querySelectorAll( numberInputSelector ).forEach( el => el.addEventListener( 'change', applyValue( rangeInputSelector ) ) )
	element.querySelectorAll( rangeInputSelector ).forEach( el => el.addEventListener( 'input', applyValue( numberInputSelector ) ) )
}
