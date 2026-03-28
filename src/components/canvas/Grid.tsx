import React, { useMemo } from 'react'
import { Line } from 'react-konva'
import { useCanvasStore } from '../../store/useCanvasStore'

// A highly optimized infinite grid component
export const Grid: React.FC = () => {
  const camera = useCanvasStore((s) => s.camera)
  
  const baseGridSize = 50
  const width = window.innerWidth
  const height = window.innerHeight

  const lines = useMemo(() => {
    const linesArr = []
    
    // 1. LOD Algorithm: Prevent browser crash on zoom-out
    let currentGridSize = baseGridSize
    if (camera.scale < 0.2) currentGridSize = baseGridSize * 5  // 250px
    if (camera.scale < 0.04) currentGridSize = baseGridSize * 25 // 1250px
    
    const unscaledWidth = width / camera.scale
    const unscaledHeight = height / camera.scale
    
    // Snap starting points to the dynamic grid size
    const startX = Math.floor((-camera.x / camera.scale) / currentGridSize) * currentGridSize
    const endX = startX + unscaledWidth + currentGridSize * 2
    
    const startY = Math.floor((-camera.y / camera.scale) / currentGridSize) * currentGridSize
    const endY = startY + unscaledHeight + currentGridSize * 2

    // 2. Render Vertical lines
    for (let x = startX; x < endX; x += currentGridSize) {
      const isOrigin = x === 0;
      linesArr.push(
        <Line 
          key={`v-${x}`} 
          points={[x, startY, x, endY]} 
          // Highlight Y-axis (vertical) in Green/bright line if origin
          stroke={isOrigin ? "rgba(76, 175, 80, 0.5)" : "rgba(255,255,255,0.05)"} 
          strokeWidth={isOrigin ? 2 / camera.scale : 1 / camera.scale} 
        />
      )
    }

    // 3. Render Horizontal lines
    for (let y = startY; y < endY; y += currentGridSize) {
      const isOrigin = y === 0;
      linesArr.push(
        <Line 
          key={`h-${y}`} 
          points={[startX, y, endX, y]} 
          // Highlight X-axis (horizontal) in Red/bright line if origin
          stroke={isOrigin ? "rgba(244, 67, 54, 0.5)" : "rgba(255,255,255,0.05)"} 
          strokeWidth={isOrigin ? 2 / camera.scale : 1 / camera.scale} 
        />
      )
    }

    return linesArr
  }, [camera.x, camera.y, camera.scale, width, height])

  return <>{lines}</>
}
