// @ts-nocheck
// Phaser is dynamically imported client-side only

export async function createPhaserGame() {
  // Dynamic import Phaser and MainScene only on client side
  const Phaser = (await import('phaser')).default
  const MainScene = (await import('./mainScene')).default

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game-container',
    backgroundColor: '#5C94FC', // Sky blue background
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 500 }, // Gravity force
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


