import Phaser from 'phaser'

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset, lifespan }) {
    if (!asset) asset = 'block'
    super(game, x, y, asset)
    this.game = game
    this.lifespan = lifespan
    this.age = 0
    this.scale.setTo(4, 4)
    // this.game.add.existing(this)
  }

  update () {
    this.age += this.game.time.elapsed
    this.alpha = 1 - ((this.age / (this.lifespan * 0.9)))
    if (this.alpha < 0.2) {
      this.alpha = 0.2
    }
    if (this.age > this.lifespan) {
      this.tint = 0xff0000
      this.body.gravity.y = 1500
      this.body.immovable = false
      this.body.checkCollision.down = false
    } else {
      if(this.genetics && this.genetics.lifespan > 0) {
        this.tint = Phaser.Color.packPixel((255 / 5) * (5 - this.genetics.lifespan), 255, (255 / 5) * (5 -this.genetics.lifespan), 1)
      }
    }
    if (this.age > (this.lifespan * 2)) {
      this.destroy()
      // this.body.immovable = false
    }
  }
}
