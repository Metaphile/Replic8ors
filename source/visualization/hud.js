const FocusRing = () => {
	const self = {}
	
	self.position = { x: 0, y: 0 }
	self.radius = 1
	
	let apparentRadius = 1
	let apparentOpacity = 1
	
	let angle = 0
	let bias = 0
	
	self.doFocusEffect = ( fromRadius ) => {
		apparentRadius = fromRadius
		apparentOpacity = 0
	}
	
	self.moveTo = ( position ) => {
		Object.assign( self.position, position )
		angle = 0
		bias = 0
	}
	
	self.update = ( dt ) => {
		apparentRadius += ( self.radius - apparentRadius ) * 13 * dt
		apparentOpacity += ( 1 - apparentOpacity ) * 13 * dt
		if ( apparentOpacity > 1 ) apparentOpacity = 1
		
		angle = ( angle + Math.PI * 1 * dt ) % Math.PI
		bias = ( 1 + Math.cos( angle ) ) * 0.5
	}
	
	self.draw = ( camera ) => {
		const ctx = camera.ctx
		
		const globalAlpha = ctx.globalAlpha
		const globalCompositeOperation = ctx.globalCompositeOperation
		
		const z = camera.getZoomLevel()
		const tau = Math.PI * 2
		
		ctx.globalAlpha = 0.8 * apparentOpacity
		// ctx.globalCompositeOperation = 'lighten'
		
		const p = self.position
		const r1 = apparentRadius + 18
		const r2 = r1 + 18 / z
		
		const color = interpolateRgba( [ 255, 128, 0, 1 ], [ 255, 69, 0, 1 ], 1 - bias )
		
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
		
		ctx.globalAlpha = globalAlpha
		ctx.globalCompositeOperation = globalCompositeOperation
	}
	
	return self
}

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
	
	let focusTarget
	let focusRing = FocusRing()
	
	self.focusOn = ( target ) => {
		if ( !focusTarget ) {
			focusRing.moveTo( target.position )
			focusRing.doFocusEffect( target.radius * 10 )
		}
		
		focusRing.radius = target.radius
		focusTarget = target
	}
	
	self.unfocus = () => {
		if ( focusTarget ) {
			// TODO animation
			focusTarget = null
		}
	}
	
	self.update = ( dt ) => {
		if ( focusTarget ) {
			const p1 = focusTarget.position
			const p2 = focusRing.position
			p2.x += ( p1.x - p2.x ) * 12 * dt
			p2.y += ( p1.y - p2.y ) * 12 * dt
		}
		
		focusRing.update( dt )
	}
	
	self.draw = ( camera ) => {
		if ( focusTarget ) focusRing.draw( camera )
	}
	
	return self
}
