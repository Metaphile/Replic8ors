export default function Hud() {
	const self = {}
	
	const focusRing = {}
	focusRing.position = { x: 0, y: 0 }
	focusRing.radius = 10
	
	self.activateFocusRing = ( position = { x: 0, y: 0 }, radius = 1 ) => {
		Object.assign( focusRing.position, position )
		focusRing.radius = radius
		
		self.focusRing = focusRing
	}
	
	self.deactivateFocusRing = () => {
		self.focusRing = null
	}
	
	self.update = ( dt ) => {
		// ...
	}
	
	self.draw = ( camera ) => {
		const ctx = camera.ctx
		const z = camera.getZoomLevel()
		const tau = Math.PI * 2
		
		const globalAlpha = ctx.globalAlpha
		ctx.globalAlpha = 0.8
		
		if ( self.focusRing ) {
			const p = self.focusRing.position
			const r2 = r1 + 16 / z
			const r1 = self.focusRing.radius + 18
			
			ctx.beginPath()
				ctx.arc( p.x, p.y, r1, 0, tau )
				ctx.arc( p.x, p.y, r2, 0, tau, true )
				ctx.fillStyle = 'orange'
				ctx.fill()
			
			ctx.beginPath()
				for ( let angle = 0; angle < tau; angle += tau / 4 ) {
					ctx.moveTo( p.x + Math.cos( angle ) * ( r2 + 5/z ), p.y + Math.sin( angle ) * ( r2 + 5/z ) )
					ctx.lineTo( p.x + Math.cos( angle ) * r2 * 20,  p.y + Math.sin( angle ) * r2 * 20 )
				}
				ctx.strokeStyle = 'orange'
				ctx.lineWidth = 2 / z
				ctx.stroke()
		}
		
		ctx.globalAlpha = globalAlpha
	}
	
	return self
}
