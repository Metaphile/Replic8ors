import assets from './predator-assets'
import { icons as neuronIcons } from './neuron-assets'

function drawShadow( ctx, p0, r0, angle = Math.PI * 3/4 ) {
	const start = angle - Math.PI/2
	const end = start + Math.PI
	
	const length = 7
	
	const tip1 = { x: 0, y: 0 }
	tip1.x = Math.cos( start + Math.PI/2 + 0.23 ) * length
	tip1.y = Math.sin( start + Math.PI/2 + 0.23 ) * length
	
	const tip2 = { x: 0, y: 0 }
	tip2.x = Math.cos( start + Math.PI/2 - 0.23 ) * length
	tip2.y = Math.sin( start + Math.PI/2 - 0.23 ) * length
	
	ctx.beginPath()
		ctx.translate( p0.x, p0.y )
		ctx.scale( r0, r0 )
		
		ctx.arc( 0, 0, 1, start, end )
		ctx.lineTo( tip1.x, tip1.y )
		ctx.lineTo( tip2.x, tip2.y )
		ctx.closePath()
		
		ctx.scale( length, length )
		ctx.fillStyle = assets.shadowGradient
		ctx.fill()
		ctx.scale( 1/length, 1/length )
		
		ctx.scale( 1 / r0, 1 / r0 )
		ctx.translate( -p0.x, -p0.y )
}

export default function PredatorView( predator ) {
	const self = Object.create( PredatorView.prototype )
	self.predator = predator
	self.angle = -Math.PI / 2
	
	self.slosh = Math.random() * Math.PI * 2
	
	return self
}

PredatorView.prototype = {
	update( dt, dt2 ) {
		this.angle = ( this.angle + ( 6.1 * dt2 ) ) % ( Math.PI * 2 )
		this.slosh = ( this.slosh + ( 0.51 * dt2 ) ) % ( Math.PI * 2 )
	},
	
	draw( ctx ) {
		const predator = this.predator
		const p0 = predator.position
		const r0 = predator.radius - 17/2
		
		{
			let slosh = this.slosh
			
			ctx.beginPath()
				ctx.arc( p0.x, p0.y, r0, 0, Math.PI * 2 )
				
				ctx.translate( p0.x, p0.y )
				ctx.scale( r0, r0 )
				ctx.fillStyle = assets.backsideGradient
				ctx.fill()
				ctx.scale( 1 / r0, 1 / r0 )
				ctx.translate( -p0.x, -p0.y )
				
				ctx.globalCompositeOperation = 'multiply'
				ctx.drawImage( neuronIcons.predator, p0.x - r0/1.5, p0.y - r0/1.5, r0/1.5 * 2, r0/1.5 * 2 )
				
				const energy = 0.85
				
				const dx = p0.x
				const dy = p0.y + r0 - ( energy * r0 * 2 ) + Math.cos( slosh * 26 ) * 0.1
				const ds = r0 * 2
				
				slosh = ( Math.cos( slosh * 7 ) * Math.sin( slosh * 13 ) ) * 0.006
				
				ctx.translate( dx, dy )
				ctx.rotate( slosh )
				ctx.scale( 1, ds )
				
				// blood of enemies
				const old = ctx.globalCompositeOperation
				ctx.globalCompositeOperation = 'darken'
				ctx.fillStyle = assets.bloodGradient
				ctx.fill()
				ctx.globalCompositeOperation = old
				
				ctx.scale( 1, 1 / ds )
				ctx.rotate( -slosh )
				ctx.translate( -dx, -dy )
		}
		
		{
			// const ga = ctx.globalAlpha
			// ctx.globalAlpha = 0.7
			ctx.drawImage( assets.face, p0.x - r0, p0.y - r0, r0 * 2, r0 * 2 )
			// ctx.globalAlpha = ga
		}
		
		// membrane
		{
			const tau = Math.PI * 2
			
			// one chemoreceptor per body segment
			const n = 8
			// angular offset of chemoreceptors
			const offset = this.angle
			// to visualize pores in cell membrane
			const gap = 0.062
			
			const cx = this.predator.position.x
			const cy = this.predator.position.y
			
			ctx.strokeStyle = assets.skinColor
			// ctx.strokeStyle = 'rgba( 255, 255, 255, 0.5 )'
			ctx.lineWidth = 17
			ctx.lineCap = 'butt'
			
			// TODO possible to do with one stroke?
			for ( var i = 0; i < n; i++ ) {
				ctx.beginPath()
					// define arc between adjacent receptors, allowing for transmembrane channels
					const startAngle = offset + (   i       / n * tau ) + ( gap / 2 )
					const endAngle   = offset + ( ( i + 1 ) / n * tau ) - ( gap / 2 )
					
					ctx.arc( cx, cy, r0, startAngle, endAngle )
					ctx.stroke()
			}
			
			ctx.beginPath()
				ctx.arc( cx, cy, r0 - ctx.lineWidth/4, 0, Math.PI * 2 )
				ctx.lineWidth /= 2
				ctx.stroke()
		}
		
		drawShadow( ctx, p0, r0 + Number.MIN_VALUE, Math.PI * 3/4 )
	},
}
