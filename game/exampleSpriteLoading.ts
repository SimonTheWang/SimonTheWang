/**
 * Example: How to load and use sprites in your Phaser game
 * 
 * In your MainScene, you would add a preload() method before create():
 */

import Phaser from 'phaser'

export class ExampleSpriteScene extends Phaser.Scene {
  preload() {
    // Load single images
    this.load.image('player', '/sprites/player/idle.png')
    this.load.image('ground', '/sprites/platforms/ground.png')
    this.load.image('platform', '/sprites/platforms/platform.png')

    // Load sprite sheets (for animations)
    this.load.spritesheet('player-run', '/sprites/player/run-sheet.png', {
      frameWidth: 16,
      frameHeight: 16,
    })

    // Load atlas (if you have a texture atlas + JSON)
    this.load.atlas('player-atlas', '/sprites/player/atlas.png', '/sprites/player/atlas.json')
  }

  create() {
    // Use loaded images
    const player = this.physics.add.sprite(100, 450, 'player')
    
    // Create animations from sprite sheets
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    })

    // Play animation
    player.play('run')
  }
}

/**
 * Tips:
 * 
 * 1. All paths start with '/' (root of public folder)
 * 2. Use PNG format for sprites (supports transparency)
 * 3. Keep sprites power-of-2 sized if possible (better performance)
 * 4. For pixel art, use nearest-neighbor scaling (already enabled in phaserGame.ts)
 * 5. Sprite sheets should have frames aligned in a grid
 */

