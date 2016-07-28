const interpolate = ( startValue, endValue, bias ) => {
	return startValue + ( endValue - startValue ) * bias
}

const interpolateRgba = ( rgba1, rgba2, bias ) => {
	const rgba3 = []
	
	for ( let i = 0; i < rgba1.length; i++ ) {
		rgba3[i] = Math.round( interpolate( rgba1[i], rgba2[i], bias ) )
	}
	
	const [ r, g, b, a ] = rgba3
	return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
}

export default function Hud() {
	const self = {}
	
	const focusRing = {}
	focusRing.position = { x: 0, y: 0 }
	focusRing.radius = 10
	
	self.activateFocusRing = ( position = { x: 0, y: 0 }, radius = 1 ) => {
		Object.assign( focusRing.position, position )
		focusRing.radius = radius
		
		angle = 0
		bias = 0
		
		self.focusRing = focusRing
	}
	
	self.deactivateFocusRing = () => {
		self.focusRing = null
	}
	
	let angle = 0
	let bias = 0
	
	self.update = ( dt ) => {
		angle = ( angle + Math.PI * 1 * dt ) % Math.PI
		bias = 1 - ( 1 + Math.cos( angle ) ) * 0.5
	}
	
	self.draw = ( camera ) => {
		const ctx = camera.ctx
		const z = camera.getZoomLevel()
		const tau = Math.PI * 2
		
		const globalAlpha = ctx.globalAlpha
		ctx.globalAlpha = 0.8
		const globalCompositeOperation = ctx.globalCompositeOperation
		ctx.globalCompositeOperation = 'lighten'
		
		if ( self.focusRing ) {
			const p = self.focusRing.position
			const r1 = self.focusRing.radius + 18
			const r2 = r1 + 18 / z
			
			const color = interpolateRgba( [ 255, 128, 0, 1 ], [ 255, 69, 0, 1 ], bias )
			
			ctx.beginPath()
				ctx.arc( p.x, p.y, r1, 0, tau )
				ctx.arc( p.x, p.y, r2, 0, tau, true )
				ctx.fillStyle = color
				ctx.fill()
			
			ctx.beginPath()
				for ( let angle = 0; angle < tau; angle += tau / 4 ) {
					ctx.moveTo( p.x + Math.cos( angle ) * ( r2 + 5/z ), p.y + Math.sin( angle ) * ( r2 + 5/z ) )
					ctx.lineTo( p.x + Math.cos( angle ) * r2 * 20,  p.y + Math.sin( angle ) * r2 * 20 )
				}
				ctx.strokeStyle = color
				ctx.lineWidth = 2 / z
				ctx.stroke()
		}
		
		ctx.globalAlpha = globalAlpha
		ctx.globalCompositeOperation = globalCompositeOperation
	}
	
	return self
}
