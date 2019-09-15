import Phaser from 'phaser'
import { centerGameObjects } from '../utils'

export default class extends Phaser.State {
  init () {}

  preload () {
    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBg')
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBar')
    centerGameObjects([this.loaderBg, this.loaderBar])

    this.load.setPreloadSprite(this.loaderBar)
    //
    // load your assets
    //
    this.load.image('mushroom', 'assets/images/sk_026.png')
    this.load.image('block', 'assets/images/sk_001.png')
    this.load.image('player', 'assets/images/s_022.png')
    this.load.spritesheet('playersprite', 'assets/images/dude-anim.png', 16, 16, 5)
  }

  create () {
    this.state.start('Game')
  }
}
