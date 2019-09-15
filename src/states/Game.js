/* globals __DEV__ */
import Phaser from 'phaser'
import Mushroom from '../sprites/Mushroom'
import Block from '../sprites/Block'
import lang from '../lang'

/*
* TODO:
* kill player if squished or dont seed a block there
* seed types
* multiple active seeds
* permanent blocks
* move ceiling up, or infinite
*/

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
    this.blockSize = 16 * 4
  }
  preload () { }

  create () {
    this.mushroom = new Mushroom({
      game: this.game,
      x: this.world.centerX,
      y: this.world.centerY,
      asset: 'mushroom'
    })
    // this.mushroom.scale.x *= 4
    // this.mushroom.scale.y *= 4
    //this.game.add.existing(this.mushroom)

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
    this.player.body.gravity.y = 1500
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
        this.germinateTickInt = 0
        this.seedBlock = this.activeBlock
        this.seedBlock.lifespan = 100000
      }
    }, this)
  }

  render () {
    if (__DEV__) {
      this.game.debug.spriteInfo(this.player, 32, 32)
    }
  }

  reset (a) {
    this.player.reset(this.game.width / 2, this.game.height / 3)
    this.blocks.destroy()
    this.generateBlocks()
  }

  update () {
    this.germinateTick()

    this.blocks.forEach(function (block) {
      if (block.tint === 0xdddddd) {
        block.tint = 0xffffff
      }
    })

    this.activeBlockl = null
    this.activeBlockr = null
    this.activeBlock = null

    this.game.physics.arcade.overlap(this.hitboxes, this.blocks, function (a,b) {
      // destroyblockRallowed = false;
      if (a.name === 'hitboxL') {
        this.activeBlockl = b
        this.activeBlockl.tint = 0xdddddd
      } else if (a.name === 'hitboxR') {
        this.activeBlockr = b
        this.activeBlockr.tint = 0xdddddd
      } else if (a.name === 'hitboxB') {
        this.activeBlock = b
        this.activeBlock.tint = 0xdddddd
      }
    }, null, this)

    this.game.physics.arcade.collide(this.player, this.blocks, function (a, b) {
    }, null, this)

    if (this.player.body.touching.down) {
      // game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
      this.game.camera.target = this.player
    } else {
      // var b = this.blocks.getFirstAlive()
      // game.camera.follow(b, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
      this.game.camera.target = this.player
    }

    if (this.player.body.touching.down) {
      if (!this.activeBlockr) {
        this.destroyblockRallowed = false
        this.activeBlockrWindup = false
        if (this.activeBlockrTimer) this.game.time.events.remove(this.activeBlockrTimer)
      }
      if (!this.activeBlockl) {
        this.destroyblockLallowed = false
        this.activeBlocklWindup = false
        if (this.activeBlocklTimer) this.game.time.events.remove(this.activeBlocklTimer)
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
      this.player.scale.x = -2
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
      this.player.scale.x = 2
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

  blockAtR (block) {
    return this.blockAt(block.x + (this.blockSize), block.y)
  }

  blockAtL (block) {
    return this.blockAt(block.x - (this.blockSize), block.y)
  }

  blockAtU (block) {
    return this.blockAt(block.x, block.y - (this.blockSize))
  }

  blockAtD (block) {
    return this.blockAt(block.x, block.y + (this.blockSize))
  }

  randomAdjacent (block) {
    var randX = Math.floor((Math.rand() * 3) - 1)
    var randY = Math.floor((Math.rand() * 3) - 1)
    return {
      x: block.x + (this.blockSize * randX),
      y: block.y + (this.blockSize * randY)
    }
  }

  generateBlocks () {
    this.blocks = this.game.add.physicsGroup()

    var height = 16
    var width = 16
    var startX = (this.game.width / 2) - ((width * this.blockSize) / 2)
    var startY = (this.game.width / 2) - ((width * this.blockSize) / 2)

    for (var x = 1; x < width; ++x) {
      for (var y = 1; y < height; ++y) {
        this.blocks.add(new Block({
          game: this.game,
          x: startX + (x * this.blockSize),
          y: startY + (y * this.blockSize),
          lifespan: 10000 + (Math.random() * 100000)
        }))
      }
    }
    this.blocks.setAll('body.immovable', true)
  }

  germinateTick () {
    if (!this.germinateTickInt) this.germinateTickInt = 0
    if (this.germinateTickInt > 1000) {
      this.germinate()
      this.germinateTickInt = 0
    } else {
      this.germinateTickInt += this.game.time.elapsed
    }
  }

  germinate () {
    if (this.seedBlock && this.seedBlock.alive) {
      if (this.seedBlock.genetics.lifespan > 0) {
        var offsetX = 0
        var offsetY = 0
        var bu = this.blockAtU(this.seedBlock)
        var bl = this.blockAtL(this.seedBlock)
        var br = this.blockAtR(this.seedBlock)
        if (!bu) {
          if (!Math.floor(Math.random() * 10) && !bl) {
            offsetX = -this.blockSize
          } else if (!Math.floor(Math.random() * 10) && !br) {
            offsetX = this.blockSize
          } else {
            offsetY = -this.blockSize
          }
        } else if (!bl && !br) {
          offsetX = (Math.floor(Math.random() * 2) - 1) * this.blockSize
        } else if (!bl) {
          offsetX = -this.blockSize
        } else if (!br) {
          offsetX = this.blockSize
        } else if (!this.blockAtD(this.seedBlock)) {
          offsetY = this.blockSize
        }
        if (offsetX || offsetY) {
          let x = this.seedBlock.x + offsetX
          let y = this.seedBlock.y + offsetY
          if (
            this.player.x + (this.player.width / 2) > x &&
            this.player.x < x + this.blockSize &&
            this.player.y + (this.player.height / 2) > y &&
            this.player.y < y + this.blockSize
          ) {
            this.player.y = this.seedBlock.y - this.blockSize - this.player.height
          }

          var block = this.blocks.add(new Block({
            game: this.game,
            x: x,
            y: y,
            lifespan: 100000
          }))
          block.body.immovable = true
          block.genetics = {
            lifespan: this.seedBlock.genetics.lifespan - 1
          }
          this.seedBlock = block
        }
      }
    }
  }
}
