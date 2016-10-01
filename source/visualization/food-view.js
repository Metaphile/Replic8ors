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
	
	update( dt, dt2 ) {
		for ( const key of Object.keys( this.effects ) ) {
			this.effects[ key ].update( dt, dt2 )
		}
	},
	
	// TODO draw gets called (once?) after effects have been deleted
	draw( ctx, ahead ) {
		if ( this.effects.crumbs ) {
			this.effects.crumbs.draw( ctx )
		} else if ( this.effects.spoiled ) {
			this.effects.spoiled.draw( ctx )
		} else if ( !this.food.eaten && !this.food.spoiled ) {
			ctx.beginPath()
				const p = this.food.position, r = this.food.radius
				ctx.arc( p.x, p.y, r, 0, Math.PI * 2 )
				ctx.fillStyle = 'white'
				ctx.fill()
		}
	},
}
