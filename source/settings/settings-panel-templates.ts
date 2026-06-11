// Settings-panel markup. Replaces the former settings-panel.ejs and
// settings-panel-field.ejs runtime EJS templates with typed string builders.

export interface FieldTemplateData {
  description: string;
  defaultValue: number;
  fieldLabel: string;
  inputName: string;
  step: number;
  value: number;
  rangeInputMinValue: number;
  rangeInputMaxValue: number;
  datalistId: string;
}

export function fieldTemplate(data: FieldTemplateData): string {
  const {
    description,
    defaultValue,
    fieldLabel,
    inputName,
    step,
    value,
    rangeInputMinValue,
    rangeInputMaxValue,
    datalistId,
  } = data;

  return `
<label title='${description} (default: ${defaultValue})'>
	<span>${fieldLabel}</span>

	<!-- number input -->
	<input type='number' name='${inputName}' step='${step}' value='${value}'>

	<!-- range input -->
	<input type='range' name='${inputName}' step='${step}' min='${rangeInputMinValue}' max='${rangeInputMaxValue}' value='${value}' list='${datalistId}'>

	<datalist id='${datalistId}'>
		<option value='0'></option>
	</datalist>
</label>
`;
}

export interface PanelTemplateData {
  predatorFields: string[];
  preyFields: string[];
  blueFields: string[];
}

export function panelTemplate(data: PanelTemplateData): string {
  const { predatorFields, preyFields, blueFields } = data;

  return `
<form id='settings-panel'>
	<div class='row'>
		<div class='column'>
			<h2>Reds</h2>
			${predatorFields.join("\n")}
		</div>

		<div class='column'>
			<h2>Greens</h2>
			${preyFields.join("\n")}
		</div>

		<div class='column'>
			<h2>Blues</h2>
			${blueFields.join("\n")}
		</div>
	</div>

	<hr>

	<div class='row'>
		<div class='column'>
			<address>
				<a href='https://github.com/Metaphile/Replic8ors' target='_blank'>https://github.com/Metaphile/Replic8ors</a><br>
				<a href='mailto:lasiler@gmail.com' target='_blank'>lasiler@gmail.com</a>
			</address>
		</div>
	</div>
</form>
`;
}
