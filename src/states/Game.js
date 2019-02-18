/* globals __DEV__ */
import Phaser from 'phaser'
import Mushroom from '../sprites/Mushroom'
import lang from '../lang'

export default class extends Phaser.State {
  init () {
    this.player = null
    this.blocks = null
    this.cursors = null
    this.jumpButton = null
    this.digButton = null
    this.actionButton = null
    this.blockDestroyCooldown = null
    this.hitboxes = null
    this.hitboxL = null
    this.hitboxR = null
    this.hitboxB = null

    this.activeBlock = null
    this.activeBlockl = null
    this.activeBlockr = null

    this.activeBlocklTimer = null
    this.activeBlocklWindup = null
    this.destroyblockLallowed = null
    this.activeBlockrTimer = null
    this.activeBlockrWindup = null
    this.destroyblockRallowed = null

    this.beginJump = null

    this.seedBlock = null
  }
  preload () { }

  create () {
    const bannerText = lang.text('welcome')
    let banner = this.add.text(this.world.centerX, this.game.height - 80, bannerText, {
      font: '40px Bangers',
      fill: '#77BFA3',
      smoothed: false
    })

    banner.padding.set(10, 16)
    banner.anchor.setTo(0.5)

    this.mushroom = new Mushroom({
      game: this.game,
      x: this.world.centerX,
      y: this.world.centerY,
      asset: 'block'
    })

    this.game.add.existing(this.mushroom)

    // game.physics.setBoundsToWorld()
    this.game.world.setBounds(0, 0, 2000, 2000)

    this.player = this.game.add.sprite(this.game.width / 2, this.game.height / 3, 'player')
    this.player.scale.x *= 2
    this.player.scale.y *= 2
    this.player.animations.add('walk')
    // player.animations.play('walk', 5, true);
    // player.animations.stop(null, true);
    this.player.anchor.x = 0.5
    this.player.anchor.y = 0.5
    this.game.physics.arcade.enable(this.player)
    // player.body.setSize(5, 10, 8, 5)
    this.player.body.collideWorldBounds = false
    this.player.checkWorldBounds = true
    this.player.body.gravity.y = 1000
    this.player.events.onOutOfBounds.add(this.reset, this)

    this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1)

    // player hitboxes
    this.hitboxes = this.game.add.group()
    this.hitboxes.enableBody = true
    this.player.addChild(this.hitboxes)
    var hbSize = this.player.width / 4
    this.hitboxL = this.hitboxes.create(0, 0, null)
    this.hitboxL.name = 'hitboxL'
    this.hitboxL.body.setSize(hbSize, hbSize, -this.player.width / 2 - (hbSize / 2), -hbSize / 2)
    this.hitboxR = this.hitboxes.create(0, 0, null)
    this.hitboxR.name = 'hitboxR'
    this.hitboxR.body.setSize(hbSize, hbSize, (this.player.width / 2) - (hbSize / 2), -hbSize / 2)
    this.hitboxB = this.hitboxes.create(0, 0, null)
    this.hitboxB.name = 'hitboxB'
    this.hitboxB.body.setSize(hbSize, hbSize, -hbSize / 2, (this.player.height / 2) - (hbSize / 2))

    this.generateBlocks()

    this.cursors = this.game.input.keyboard.createCursorKeys()
    this.jumpButton = this.game.input.keyboard.addKey(Phaser.Keyboard.UP)
    this.digButton = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN)
    this.actionButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

    this.actionButton.onDown.add(function () {
      if (this.activeBlock) {
        this.activeBlock.genetics = {
          lifespan: 5
        }
        this.seedBlock = this.activeBlock
      }
    }, this)
  }

  render () {
    if (__DEV__) {
      this.game.debug.spriteInfo(this.mushroom, 32, 32)
    }
  }

  reset (a) {
    this.player.reset(350, 100)
    this.blocks.destroy()
    this.generateBlocks()
  }

  update () {
    this.blocks.forEach(function (block) {
      block.alpha = 1
    })

    this.activeBlockl = null
    this.activeBlockr = null
    this.activeBlock = null

    this.game.physics.arcade.overlap(this.hitboxes, this.blocks, function (a,b) {
      // destroyblockRallowed = false;
      if (a.name === 'hitboxL') {
        this.activeBlockl = b
        this.activeBlockl.alpha = 0.8
      } else if (a.name === 'hitboxR') {
        this.activeBlockr = b
        this.activeBlockr.alpha = 0.8
      } else if (a.name === 'hitboxB') {
        this.activeBlock = b
        this.activeBlock.alpha = 0.8
      }
    }, null, this)

    this.game.physics.arcade.collide(this.player, this.blocks, function (a, b) {
    }, null, this)

    if (this.player.body.touching.down) {
      // game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
      this.game.camera.target = this.player
    } else {
      var b = this.blocks.getFirstAlive()
      // game.camera.follow(b, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
      this.game.camera.target = null
    }

    if (this.player.body.touching.down) {
      if (!this.activeBlockr) {
        this.destroyblockRallowed = false
        this.activeBlockrWindup = false
        if (this.activeBlockrTimer) this.game.time.events.remove(this.activeBlockrTimer);
      }
      if (!this.activeBlockl) {
        this.destroyblockLallowed = false
        this.activeBlocklWindup = false
        if (this.activeBlocklTimer) this.game.time.events.remove(this.activeBlocklTimer);
      }
    } else {
      if (this.activeBlockrTimer) this.game.time.events.remove(this.activeBlockrTimer)
      if (this.activeBlocklTimer) this.game.time.events.remove(this.activeBlocklTimer)
      this.activeBlockrWindup = false
      this.activeBlocklWindup = false
      this.destroyblockRallowed = false
      this.destroyblockLallowed = false
    }

    if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
      if (this.player.body.velocity.x > 0 || this.player.body.velocity.x < 0) {
        if (this.player.body.velocity.x < 0.1 && this.player.body.velocity.x > -0.1) {
          this.player.body.velocity.x = 0
        } else {
          this.player.body.velocity.x = this.player.body.velocity.x * 0.9
        }
      }
    }
    if (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0) {
      this.player.animations.play('walk', 5, true)
    } else {
      this.player.animations.stop(null, true)
    }

    if (this.cursors.left.isDown) {
      if (!this.activeBlockl) {
        if (this.player.body.velocity.x > -250) {
          this.player.body.velocity.x -= 10
        }
      } else {
        this.player.body.velocity.x = 0
      }

      if (this.player.body.onFloor() || this.player.body.touching.down) {
        if (this.activeBlockl && !this.activeBlocklWindup) {
          this.activeBlocklWindup = true
          this.activeBlocklTimer = this.game.time.events.loop(
            500,
            function () {
              this.activeBlocklWindup = false
              this.destroyblockLallowed = true
              this.game.time.events.remove(this.activeBlocklTimer)
            },
            this
          )
        }
        if (this.activeBlockl && this.destroyblockLallowed) {
          this.destroyblockLallowed = false
          this.activeBlockl.destroy()
        }
      }
    } else if (this.cursors.right.isDown) {
      if (!this.activeBlockr) {
        if (this.player.body.velocity.x < 250) {
          this.player.body.velocity.x += 10
        }
      } else {
        this.player.body.velocity.x = 0
      }

      if (this.player.body.onFloor() || this.player.body.touching.down) {
        if (this.activeBlockr && !this.activeBlockrWindup) {
          this.activeBlockrWindup = true
          this.activeBlockrTimer = this.game.time.events.loop(
            500,
            function () {
              this.activeBlockrWindup = false
              this.destroyblockRallowed = true
              this.game.time.events.remove(this.activeBlockrTimer)
            },
            this
          )
        }
        if (this.activeBlockr && this.destroyblockRallowed) {
          this.destroyblockRallowed = false
          this.activeBlockr.destroy()
        }
      }
    }

    if (this.beginJump && !this.jumpButton.isDown) {
      this.beginJump = false
    }
    if (this.jumpButton.isDown && (this.player.body.onFloor() || this.player.body.touching.down || this.beginJump)) {
      if (this.beginJump) {
        this.player.body.velocity.y -= 50 / (this.beginJump * 0.4)
        if (this.beginJump > 200) {
          this.beginJump = false
        }
        ++this.beginJump
      } else {
        this.player.body.velocity.y = -150
        this.beginJump = 1
      }
    }

    if (
      this.digButton.isDown &&
      (
        this.player.body.onFloor() || 
        this.player.body.touching.down
      ) &&
      this.activeBlock &&
      !this.blockDestroyCooldown
    ) {
      this.blockDestroyCooldown = true
      this.activeBlock.destroy()
      this.blockDestroyCooldownTimer = this.game.time.events.loop(
        150,
        function () {
          this.blockDestroyCooldown = false
          this.game.time.events.remove(this.blockDestroyCooldownTimer)
        },
        this
      )
    }
  }

  blockAt (x, y) {
    var spaceTaken = false
    this.blocks.forEach(function (b) {
      if (b.x === x && b.y === y) {
        spaceTaken = true
      }
    })
    return spaceTaken
  }

  generateBlocks () {
    this.blocks = this.game.add.physicsGroup()

    var height = 8
    var width = 8
    var blockSize = 32
    var startX = (this.game.width / 2) - ((width * blockSize) / 2);
    var startY = (this.game.width / 2) - ((width * blockSize) / 2)

    for (var x = 1; x < width; ++x) {
      for (var y = 1; y < height; ++y) {
        var block = this.blocks.create(
          startX + (x * blockSize),
          startY + (y * blockSize),
          'block'
        )
        block.tint = Math.random() * 0xffffff
      }
    }
    this.blocks.setAll('body.immovable', true)

    // seed test
    this.newBlockTestTimer = this.game.time.events.loop(
      200,
      function () {
        if (this.seedBlock && this.seedBlock.alive) {
          if (this.seedBlock.genetics.lifespan > 0) {
            var spaceTaken = this.blockAt(this.seedBlock.x + (blockSize), this.seedBlock.y)
            if (!spaceTaken) {
              var block = this.blocks.create(
                this.seedBlock.x + (blockSize),
                this.seedBlock.y,
                'block'
              )
              block.body.immovable = true
              block.tint = Math.random() * 0xffffff
              block.genetics = {
                lifespan: this.seedBlock.genetics.lifespan - 1
              }
              this.seedBlock = block
            }
          }
        }
      },
      this
    )
  }
}
