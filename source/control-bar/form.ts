// Control-bar markup. Replaces the former form.ejs (static template) and the
// Font Awesome CDN icons with locally-bundled inline SVG.

// 24x24 icons, sized in em so they scale with the button font-size, drawn in
// the current text color.
const icon = ( paths: string ): string =>
	`<svg viewBox='0 0 24 24' width='1.25em' height='1.25em' fill='currentColor' style='vertical-align: middle;' aria-hidden='true'>${ paths }</svg>`

const icons = {
	pause: icon( `<rect x='6' y='5' width='4' height='14'/><rect x='14' y='5' width='4' height='14'/>` ),
	stepForward: icon( `<path d='M5 4l11 8-11 8z'/><rect x='17' y='4' width='3' height='16'/>` ),
	play: icon( `<path d='M6 4l15 8-15 8z'/>` ),
	fastForward: icon( `<path d='M3 5l9 7-9 7z'/><path d='M13 5l9 7-9 7z'/>` ),
	bolt: icon( `<path d='M13 2L4 14h6l-1 8 9-12h-6z'/>` ),
	cog: icon( `<path d='M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1l.4 2.5h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z'/>` ),
}

export default function formTemplate(): string {
	return `
<form id='control-bar-form'>
	<button class='transport' name='pause-resume' title='Pause / play [spacebar]'>${ icons.pause }</button>
	<button class='transport' name='step' title='Step forward [right arrow key]'>${ icons.stepForward }</button>
	<button class='transport' name='speed-normal' title='Play [1]'>${ icons.play }</button>
	<button class='transport' name='speed-fast' title='Fast forward [2]'>${ icons.fastForward }</button>
	<button class='transport' name='speed-turbo' title='Turbo [3]'>${ icons.bolt }</button>

	<input name='elapsed-sim-time' size='16' readonly tabindex='-1'>

	<button name='settings' title='Settings [backtick]'>${ icons.cog }</button>
</form>
`
}
