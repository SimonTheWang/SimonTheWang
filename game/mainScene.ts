import Phaser from 'phaser'
import { WORLD_WIDTH, WORLD_HEIGHT } from './phaserGame'

// Retro color palette
const COLORS = {
  SKY: 0x5c94fc,
  GROUND: 0x8b4513,
  BRICK: 0xc0392b,
  GRASS: 0x27ae60,
  PLAYER: 0xf39c12,
  PLATFORM: 0x95a5a6,
}

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private breakableBlocks!: Phaser.Physics.Arcade.StaticGroup
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private attackHitbox!: Phaser.GameObjects.Graphics
  private blocksBroken: number = 0
  private spotifyPlayer!: HTMLIFrameElement | null
  private keys!: {
    a: Phaser.Input.Keyboard.Key
    w: Phaser.Input.Keyboard.Key
    e: Phaser.Input.Keyboard.Key
    r: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
    f: Phaser.Input.Keyboard.Key
  }

  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    // White_Werewolf sprite sheets
    // Frame dimensions - 128x128 pixels per frame
    // Idle: 1024x128 = 8 frames (1024/128 = 8)
    // Walk: 1408x128 = 11 frames (1408/128 = 11)
    // Run: 1152x128 = 9 frames (1152/128 = 9)
    // Jump: 1408x128 = 11 frames
    // Attack_1: 768x128 = 6 frames (768/128 = 6)
    // Hurt: 256x128 = 2 frames (256/128 = 2)
    const frameWidth = 128
    const frameHeight = 128

    // Load Attack sprite sheets (3 frames)
    this.load.spritesheet('attack', '/sprites/werewolf_2/White_Werewolf/Attack_1.png', {
      frameWidth: frameWidth,
      frameHeight: frameHeight,
    })
    this.load.image('attack-2', '/sprites/werewolf_2/White_Werewolf/Attack_2.png')
    this.load.image('attack-3', '/sprites/werewolf_2/White_Werewolf/Attack_3.png')

    // Load other sprite sheets
    this.load.spritesheet('idle', '/sprites/werewolf_2/White_Werewolf/Idle.png', {
      frameWidth: frameWidth,
      frameHeight: frameHeight,
    })

    this.load.spritesheet('jump', '/sprites/werewolf_2/White_Werewolf/Jump.png', {
      frameWidth: frameWidth,
      frameHeight: frameHeight,
    })

    this.load.spritesheet('walk', '/sprites/werewolf_2/White_Werewolf/Walk.png', {
      frameWidth: frameWidth,
      frameHeight: frameHeight,
    })

    this.load.spritesheet('run', '/sprites/werewolf_2/White_Werewolf/Run.png', {
      frameWidth: frameWidth,
      frameHeight: frameHeight,
    })

    this.load.spritesheet('hurt', '/sprites/werewolf_2/White_Werewolf/Hurt.png', {
      frameWidth: frameWidth,
      frameHeight: frameHeight,
    })

    this.load.spritesheet('run-attack', '/sprites/werewolf_2/White_Werewolf/Run+Attack.png', {
      frameWidth: frameWidth,
      frameHeight: frameHeight,
    })

    // Add file load error handler for debugging
    this.load.on('filecomplete', (key: string, type: string, data: any) => {
      console.log('Loaded:', key, type)
    })

    this.load.on('loaderror', (file: any) => {
      console.error('Failed to load:', file.key, file.url)
    })
  }

  create() {
    // Set world bounds - wider than screen
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    
    // Set background color
    this.cameras.main.setBackgroundColor(COLORS.SKY)
    
    // Set up camera to follow player and stay within world bounds
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    
    // Create platforms group
    this.platforms = this.physics.add.staticGroup()
    
    // Create breakable blocks group (static, like platforms)
    this.breakableBlocks = this.physics.add.staticGroup()

    // Ground platform (full width of world at bottom)
    // Position: y at WORLD_HEIGHT - 16 means top of ground is at WORLD_HEIGHT - 16
    // Rectangle center is at y, so ground top is at y - height/2 = WORLD_HEIGHT - 16 - 16 = WORLD_HEIGHT - 32
    const ground = this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT - 16, WORLD_WIDTH, 32, COLORS.GROUND)
    this.physics.add.existing(ground, true) // true = static body
    this.platforms.add(ground)
    
    // Create some breakable blocks
    this.createBreakableBlock(600, WORLD_HEIGHT - 160) // On ground level
    this.createBreakableBlock(900, WORLD_HEIGHT - 160)
    this.createBreakableBlock(1200, WORLD_HEIGHT - 260) // Floating above ground
    
    // Ground top surface is at: ground.y - ground.height/2 = (WORLD_HEIGHT - 16) - 16 = WORLD_HEIGHT - 32
    // Player should spawn with bottom at ground top, so player.y = (WORLD_HEIGHT - 32) - (player.height/2)

    // Create animations
    this.createAnimations()

    // Create player sprite - start at center of viewport, positioned on top of ground
    // Ground top is at WORLD_HEIGHT - 32, player center should be at ground top - half player height
    // Player scaled height = 128 * 2 = 256, so half = 128
    // Player y = (WORLD_HEIGHT - 32) - 128 = WORLD_HEIGHT - 160
    const playerStartY = WORLD_HEIGHT - 160 // On top of ground
    this.player = this.physics.add.sprite(400, playerStartY, 'idle', 0)
    this.player.setBounce(0.2)
    this.player.setCollideWorldBounds(true)
    this.player.setVisible(true)
    this.player.setOrigin(0.5, 0.5)
    
    // Make camera follow player, keeping player centered
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    // Keep player centered in viewport
    this.cameras.main.setDeadzone(0, 0)
    
    // Scale player
    const spriteScale = 2
    this.player.setScale(spriteScale)
    
    // Adjust collision box to match sprite frame size (128x128)
    const frameSize = 128
    this.player.body!.setSize(frameSize, frameSize)

    // Create attack hitbox visual indicator (hidden by default)
    this.attackHitbox = this.add.graphics()
    this.attackHitbox.setDepth(100) // Above everything
    this.attackHitbox.setVisible(false)

    // Debug: Log sprite info
    console.log('Player sprite created:', {
      texture: this.player.texture.key,
      frame: this.player.frame.name,
      visible: this.player.visible,
      x: this.player.x,
      y: this.player.y,
      scale: this.player.scaleX,
      width: this.player.width,
      height: this.player.height
    })

    // Create collisions
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.player, this.breakableBlocks)

    // Add animation complete listener to player sprite
    // Note: Jump animation will stay on last frame until landing (handled in update loop)
    this.player.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
      if (anim.key === 'bite' || anim.key === 'howl') {
        // Return to idle, the update loop will handle switching to walk if moving
        this.player.play('idle', true)
      }
      // Jump animation: don't switch here - update loop will handle when player lands
    })

    // Create cursor keys for movement
    this.cursors = this.input.keyboard!.createCursorKeys()

    // Create custom keys for movesets (a, w, e, r, s, f)
    this.keys = {
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      e: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      r: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      f: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F),
    }

    // Ensure player is visible and on correct layer
    this.player.setDepth(10) // Put player above other objects
    
    // Start with idle animation - set frame first, then play
    if (this.anims.exists('idle')) {
      const idleAnim = this.anims.get('idle')
      // Set first frame explicitly to ensure sprite is visible
      if (idleAnim.frames.length > 0) {
        this.player.setFrame(idleAnim.frames[0].name)
      }
      // Then play the animation
      this.player.play('idle')
      console.log('Playing idle animation, frame count:', idleAnim.frames.length)
    } else {
      console.error('Idle animation does not exist!')
      // Fallback: just display the first frame of the spritesheet
      this.player.setFrame(0)
    }
    
    console.log('Player created at:', this.player.x, this.player.y, 'visible:', this.player.visible, 'hasTexture:', !!this.player.texture)
  }

  private createAnimations() {
    // Attack animation (q key) - uses Attack_1 sprite sheet frames
    this.anims.create({
      key: 'bite',
      frames: this.anims.generateFrameNumbers('attack', { start: 0, end: -1 }),
      frameRate: 12,
      repeat: 0, // Play once
    })

    // Walk animation (w key)
    this.anims.create({
      key: 'walk-normal',
      frames: this.anims.generateFrameNumbers('walk', { start: 0, end: -1 }),
      frameRate: 10,
      repeat: -1, // Loop
    })

    // Hurt/Howl animation (e key) - using Hurt sprite sheet
    this.anims.create({
      key: 'howl',
      frames: this.anims.generateFrameNumbers('hurt', { start: 0, end: -1 }),
      frameRate: 10,
      repeat: 0, // Play once
    })

    // Jump animation (r key)
    // First, we need to get the total frame count to calculate frame -4
    const jumpFrames = this.anims.generateFrameNumbers('jump', { start: 0, end: -1 })
    const totalFrames = jumpFrames.length
    const stopFrame = totalFrames - 4 // 4 frames from the end
    
    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('jump', { start: 0, end: stopFrame }),
      frameRate: 12,
      repeat: 0, // Play once
      holdOnLastFrame: true, // Stay on last frame (which is frame -4) until stopped
    })

    // Run animation (d key) - energized/faster walk
    this.anims.create({
      key: 'walk-energized',
      frames: this.anims.generateFrameNumbers('run', { start: 0, end: -1 }),
      frameRate: 12,
      repeat: -1, // Loop
    })

    // Idle animation (f key)
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('idle', { start: 0, end: -1 }),
      frameRate: 8,
      repeat: -1, // Loop
    })

    // Debug: Check idle animation
    const idleAnim = this.anims.get('idle')
    console.log('Idle animation created:', {
      key: idleAnim.key,
      frameCount: idleAnim.frames.length,
      frameRate: idleAnim.frameRate
    })
    
    // Log first frame info
    if (idleAnim.frames.length > 0) {
      console.log('First frame:', {
        textureKey: idleAnim.frames[0].textureKey,
        frameName: idleAnim.frames[0].name,
        width: idleAnim.frames[0].width,
        height: idleAnim.frames[0].height
      })
    }
  }

  private createPlatform(x: number, y: number, width: number, height: number) {
    // Create rectangle with physics body
    const platform = this.add.rectangle(x, y, width, height, COLORS.PLATFORM)
    this.physics.add.existing(platform, true) // true = static body
    this.platforms.add(platform)
  }

  private createBreakableBlock(x: number, y: number) {
    // Create breakable block - same size as player collision box (128x128)
    const block = this.add.rectangle(x, y, 128, 128, COLORS.BRICK)
    this.physics.add.existing(block, true) // true = static body
    block.setData('breakable', true)
    this.breakableBlocks.add(block)
  }

  private showAttackHitbox() {
    // Attack range: bigger and in front of player
    const attackRangeX = 250 // Horizontal range (width)
    const attackRangeY = 200 // Vertical range (height)
    const attackOffsetX = 150 // How far forward the attack extends
    
    // Determine attack position based on player facing direction
    const isFacingLeft = this.player.flipX
    const attackCenterX = isFacingLeft 
      ? this.player.x - attackOffsetX  // Attack to the left
      : this.player.x + attackOffsetX  // Attack to the right
    const attackCenterY = this.player.y
    
    this.attackHitbox.clear()
    this.attackHitbox.lineStyle(3, 0xff0000, 1) // Red outline, thicker
    // Draw rectangle centered on attack position
    this.attackHitbox.strokeRect(
      attackCenterX - attackRangeX / 2,
      attackCenterY - attackRangeY / 2,
      attackRangeX,
      attackRangeY
    )
    this.attackHitbox.setVisible(true)
    
    // Hide hitbox after 0.5 seconds
    this.time.delayedCall(500, () => {
      this.attackHitbox.setVisible(false)
    })
  }

  private breakBlock(block: Phaser.GameObjects.Rectangle) {
    if (!block || !block.active) return
    
    this.blocksBroken++
    console.log('Breaking block at:', block.x, block.y, 'Total broken:', this.blocksBroken)
    
    // Play Spotify playlist when first block is broken
    if (this.blocksBroken === 1) {
      this.playSpotifyPlaylist()
    }
    
    // Create a simple particle effect when breaking
    const particles = this.add.particles(block.x, block.y, undefined, {
      speed: { min: 50, max: 150 },
      scale: { start: 0.3, end: 0 },
      lifespan: 300,
      tint: COLORS.BRICK,
      quantity: 10,
    })

    // Remove from physics group first
    this.breakableBlocks.remove(block)
    
    // Destroy block after short delay
    this.time.delayedCall(100, () => {
      if (block.active) {
        block.destroy()
      }
      if (particles) {
        particles.destroy()
      }
    })
  }

  private playSpotifyPlaylist() {
    // Create Spotify player iframe
    if (typeof window !== 'undefined' && !this.spotifyPlayer) {
      const container = document.getElementById('phaser-game-container')
      if (container && container.parentElement) {
        this.spotifyPlayer = document.createElement('iframe')
        this.spotifyPlayer.src = 'https://open.spotify.com/embed/playlist/0ot7GNOLNaAIfzuy85mlVJ?utm_source=generator'
        this.spotifyPlayer.width = '100%'
        this.spotifyPlayer.height = '352'
        this.spotifyPlayer.frameBorder = '0'
        this.spotifyPlayer.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
        this.spotifyPlayer.style.borderRadius = '12px'
        this.spotifyPlayer.style.position = 'fixed'
        this.spotifyPlayer.style.bottom = '20px'
        this.spotifyPlayer.style.right = '20px'
        this.spotifyPlayer.style.width = '300px'
        this.spotifyPlayer.style.height = '352px'
        this.spotifyPlayer.style.zIndex = '1000'
        this.spotifyPlayer.loading = 'lazy'
        
        container.parentElement.appendChild(this.spotifyPlayer)
        console.log('Spotify playlist started!')
      }
    }
  }

  update() {
    const isMoving = this.cursors.left!.isDown || this.cursors.right!.isDown
    const isJumping = this.cursors.up!.isDown && this.player.body!.touching.down

    // Horizontal movement with arrow keys
    if (this.cursors.left!.isDown) {
      this.player.setVelocityX(-200)
      this.player.setFlipX(true) // Facing left - flip horizontally
    } else if (this.cursors.right!.isDown) {
      this.player.setVelocityX(200)
      this.player.setFlipX(false) // Facing right - normal direction
    } else {
      this.player.setVelocityX(0)
    }

    // Check if we're playing a one-time animation that should not be interrupted
    const currentAnim = this.player.anims.currentAnim
    const isOneTimeAnim = currentAnim && 
      (currentAnim.key === 'bite' || 
       currentAnim.key === 'howl' || 
       currentAnim.key === 'jump') &&
      !currentAnim.isComplete

    // Jumping with arrow up key (only when on ground)
    // Play jump animation when jumping
    if (isJumping && this.player.body!.touching.down) {
      this.player.play('jump', true)
      this.player.setVelocityY(-350) // Reduced jump height
    }

    // R - Jump (animation trigger + physics jump)
    if (Phaser.Input.Keyboard.JustDown(this.keys.r) && this.player.body!.touching.down) {
      this.player.play('jump', true)
      this.player.setVelocityY(-350) // Reduced jump height
    }

    // Moveset controls
    // A - Attack/Bite (attack breakable blocks)
    if (Phaser.Input.Keyboard.JustDown(this.keys.a)) {
      this.player.play('bite', true)
      
      // Show attack hitbox
      this.showAttackHitbox()
      
      // Check if player is near a breakable block and break it
      // Attack range: bigger and in front of player
      const attackRangeX = 250
      const attackRangeY = 200
      const attackOffsetX = 150
      
      // Determine attack position based on player facing direction
      const isFacingLeft = this.player.flipX
      const attackCenterX = isFacingLeft 
        ? this.player.x - attackOffsetX
        : this.player.x + attackOffsetX
      const attackCenterY = this.player.y
      
      this.breakableBlocks.children.entries.forEach((child: any) => {
        const block = child as Phaser.GameObjects.Rectangle
        if (!block || !block.active) return
        
        // Check if block is within attack hitbox
        const blockX = block.x
        const blockY = block.y
        
        const distanceX = Math.abs(blockX - attackCenterX)
        const distanceY = Math.abs(blockY - attackCenterY)
        
        // Check if block is within attack range (centered in front of player)
        const isInRange = distanceX < attackRangeX / 2 && distanceY < attackRangeY / 2
        
        if (isInRange && block.getData('breakable')) {
          console.log('Block found within range, breaking...', {
            playerX: this.player.x,
            playerY: this.player.y,
            blockX,
            blockY,
            attackCenterX,
            attackCenterY,
            distanceX,
            distanceY
          })
          this.breakBlock(block)
        }
      })
    }
    
    // Hide attack hitbox after attack animation
    if (this.player.anims.currentAnim?.key === 'bite' && this.player.anims.currentAnim.isComplete) {
      this.attackHitbox.setVisible(false)
    }

    // E - Howl
    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
      this.player.play('howl', true)
    }

    // F - Idle/Reset
    if (Phaser.Input.Keyboard.JustDown(this.keys.f)) {
      this.player.play('idle', true)
      this.player.setVelocityX(0)
    }

    // Check if player is in the air
    const isInAir = !this.player.body!.touching.down

    // If jump animation completed but player is still in air, stay on last frame
    if (currentAnim?.key === 'jump' && currentAnim.isComplete && isInAir) {
      // Keep jump animation on last frame - don't switch
      // The holdOnLastFrame setting will keep it there
    }
    // If player lands (was in jump animation and now touching ground), switch to appropriate animation
    else if (currentAnim?.key === 'jump' && !isInAir) {
      // Landed - switch to movement animation or idle
      if (isMoving && !isOneTimeAnim) {
        if (this.keys.s.isDown) {
          // S key held while moving = run
          this.player.play('walk-energized', true)
        } else if (this.keys.w.isDown) {
          this.player.play('walk-normal', true)
        } else {
          this.player.play('walk-normal', true)
        }
      } else {
        this.player.play('idle', true)
      }
    }
    // Movement animations - play run only when S is held AND moving
    else if (isMoving && !isOneTimeAnim && currentAnim?.key !== 'jump') {
      // S key - Run (energized/fast) - only while moving AND holding S
      if (this.keys.s.isDown) {
        if (currentAnim?.key !== 'walk-energized') {
          this.player.play('walk-energized', true)
        }
      }
      // W key - Walk (normal)
      else if (this.keys.w.isDown) {
        if (currentAnim?.key !== 'walk-normal') {
          this.player.play('walk-normal', true)
        }
      }
      // Default - play walk-normal when moving without W or S
      else {
        if (currentAnim?.key !== 'walk-normal' && currentAnim?.key !== 'walk-energized') {
          this.player.play('walk-normal', true)
        }
      }
    }
    // Not moving - return to idle (but not if jumping)
    else if (!isMoving && !isOneTimeAnim && currentAnim?.key !== 'jump') {
      // Stop walk/run animations when not moving
      if (currentAnim && 
          (currentAnim.key === 'walk-normal' || currentAnim.key === 'walk-energized')) {
        this.player.play('idle', true)
      }
      // Default to idle if no animation or wrong animation
      else if (!currentAnim || currentAnim.key !== 'idle') {
        this.player.play('idle', true)
      }
    }
  }
}

