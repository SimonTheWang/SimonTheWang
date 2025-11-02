import Phaser from 'phaser'
import MainScene from './mainScene'

export function createPhaserGame(): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game-container',
    backgroundColor: '#5C94FC', // Sky blue background
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 500 }, // Gravity force
        debug: true, // Show physics bodies/hitboxes
      },
    },
    scene: MainScene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: true, // Enable pixel-perfect rendering
      antialias: false,
    },
  }

  return new Phaser.Game(config)
}

// World dimensions - map is wider than screen
export const WORLD_WIDTH = 2400  // 3x wider than viewport
export const WORLD_HEIGHT = 600  // Same as viewport height

