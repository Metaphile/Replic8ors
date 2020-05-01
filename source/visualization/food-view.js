import * as assets from './food-assets'

export default function FoodView( food ) {
	const self = Object.create( FoodView.prototype )
	self.food = food
	self.effects = {}
	
	return self
}

FoodView.prototype = {
	doCrumbsEffect( count = 3, direction = null, maxSpeed = 80 ) {
		const self = this
		
		return new Promise( resolve => {
			const onDone = () => {
				delete self.effects.crumbs
				resolve()
			}
			
			const maxRadius = self.food.radius
			const opts = { count, direction, maxSpeed, onDone, maxRadius }
			const effect = assets.CrumbsEffect( this.food.position, opts )
			self.effects.crumbs = effect
		} )
	},
	
	doSpoiledEffect() {
		const self = this
		
		return new Promise( resolve => {
			const onDone = () => {
				delete self.effects.spoiled
				resolve()
			}
			
			self.effects.spoiled = assets.SpoiledEffect( this.food.position, onDone )
		} )
	},
	
	doDestroyedEffect() {
		return this.doCrumbsEffect()
	},
	
	doEatenEffect() {
		return this.doCrumbsEffect()
	},
	
	update( dt_real, dt_sim ) {
		for ( const key of Object.keys( this.effects ) ) {
			this.effects[ key ].update( dt_real, dt_sim )
		}
	},
	
	// TODO draw gets called (once?) after effects have been deleted
	draw( ctx, ahead ) {
		if ( this.effects.crumbs ) {
			this.effects.crumbs.draw( ctx )
		} else if ( this.effects.spoiled ) {
			this.effects.spoiled.draw( ctx )
		} else if ( !this.food.eaten && !this.food.spoiled ) {
			ctx.savePartial( 'fillStyle' )
			
			const p = this.food.position, r = this.food.radius
			
			ctx.beginPath()
				ctx.arc( p.x, p.y, r, 0, Math.PI * 2 )
				ctx.fillStyle = 'gray'
				ctx.fill()
				ctx.lineWidth = 1
				ctx.strokeStyle = 'gray'
				ctx.stroke()
			
			ctx.beginPath()
				ctx.moveTo( p.x, p.y )
				ctx.arc( p.x, p.y, r, Math.max( 1 - this.food.energy, 0 ) * Math.PI * 2 - ( Math.PI / 2 ), Math.PI * 2 - ( Math.PI / 2 ) )
				// ctx.globalCompositeOperation = 'screen'
				ctx.fillStyle = 'white'
				ctx.fill()
			
			ctx.restorePartial()
		}
	},
}
