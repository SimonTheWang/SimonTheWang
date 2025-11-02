# Sprite Assets

Place your sprite images here.

## Recommended Structure

```
sprites/
  ├── player/
  │   ├── idle.png
  │   ├── run-1.png
  │   ├── run-2.png
  │   └── jump.png
  ├── platforms/
  │   ├── ground.png
  │   └── platform.png
  └── tiles/
      └── ...
```

## Usage in Phaser

Reference sprites using absolute paths starting from `/`:

```typescript
this.load.image('player', '/sprites/player/idle.png')
this.load.image('ground', '/sprites/platforms/ground.png')
```

Next.js serves files from the `public` folder at the root URL, so `/sprites/player.png` maps to `public/sprites/player.png`.

