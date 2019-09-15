import Phaser from 'phaser'

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset }) {
    super(game, x, y, asset)
    this.scale.setTo(4, 4)
  }

  update () {
    this.angle += 1
  }
}
