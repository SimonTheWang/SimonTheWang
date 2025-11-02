'use client'

import { useEffect, useRef } from 'react'
import { createPhaserGame } from '@/game/phaserGame'
import type Phaser from 'phaser'

export default function GamePage() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (gameContainerRef.current && !gameInstanceRef.current) {
      gameInstanceRef.current = createPhaserGame()
    }

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true)
        gameInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
      <div
        id="phaser-game-container"
        ref={gameContainerRef}
        style={{
          imageRendering: 'pixelated' as const,
        }}
      />
    </div>
  )
}
