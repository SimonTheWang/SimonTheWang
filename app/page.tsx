'use client'

import { useEffect, useRef } from 'react'

export default function Home() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let mounted = true

    const initGame = async () => {
      if (gameContainerRef.current && !gameInstanceRef.current && mounted) {
        try {
          // Dynamically import Phaser only on client side
          const { createPhaserGame } = await import('@/game/phaserGame')
          gameInstanceRef.current = await createPhaserGame()
        } catch (error) {
          console.error('Failed to load Phaser game:', error)
        }
      }
    }

    initGame()

    return () => {
      mounted = false
      if (gameInstanceRef.current) {
        try {
          gameInstanceRef.current.destroy(true)
        } catch (error) {
          console.error('Error destroying game:', error)
        }
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
