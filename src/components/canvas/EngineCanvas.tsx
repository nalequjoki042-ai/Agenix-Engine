import React, { useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Text, Group } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { useCanvasStore } from '../../store/useCanvasStore'
import { useUIStore } from '../../store/useUIStore'
import { Grid } from './Grid'

export const EngineCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const nodes = useCanvasStore(s => s.nodes)
  const camera = useCanvasStore(s => s.camera)
  const setCamera = useCanvasStore(s => s.setCamera)
  const selectNode = useCanvasStore(s => s.selectNode)
  const updateNode = useCanvasStore(s => s.updateNode)
  const selectedNodeIds = useCanvasStore(s => s.selectedNodeIds)
  
  const { openContextMenu, closeContextMenu } = useUIStore()

  // --- Zoom logic ---
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = e.target.getStage()
    if (!stage) return

    const scaleBy = 1.05
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    // Direction (zoom in or zoom out)
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    
    // Limits
    if (newScale < 0.1 || newScale > 5) return

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }

    setCamera({ scale: newScale, x: newPos.x, y: newPos.y })
  }

  // --- Dragging Camera ---
  const handleDragCamera = (e: KonvaEventObject<MouseEvent>) => {
    // Only drag canvas if background was target
    if (e.target === e.target.getStage()) {
      setCamera({
        x: e.target.x(),
        y: e.target.y()
      })
    }
  }

  // --- Clicking (Selection & Context menu) ---
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    
    // Handle specific mouse buttons
    if (e.evt.button === 2) { // Right Click
      e.evt.preventDefault() // block standard menu handled in App.tsx wrapper usually, but just in case
      const stage = e.target.getStage()
      if (!stage) return
      
      const pointer = stage.getPointerPosition()
      if(!pointer) return
      
      // Calculate real world coordinates relative to Canvas zoom/pan
      const canvasX = (pointer.x - camera.x) / camera.scale
      const canvasY = (pointer.y - camera.y) / camera.scale
      
      openContextMenu(pointer.x, pointer.y, canvasX, canvasY)
    } else if (e.evt.button === 0) { // Left Click
      closeContextMenu()
      if (clickedOnEmpty) {
        selectNode(null)
      }
    }
  }

  // Resize observer to keep canvas full screen
  const [size, setSize] = React.useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div ref={containerRef} className="canvas-container" onContextMenu={e => e.preventDefault()}>
      <Stage
        width={size.width}
        height={size.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        draggable // we can drag the whole stage to pan
        x={camera.x}
        y={camera.y}
        scaleX={camera.scale}
        scaleY={camera.scale}
        onDragMove={handleDragCamera}
      >
        <Layer>
          <Grid />
        </Layer>
        
        <Layer>
          {nodes.map(node => (
            <Group 
              key={node.id} 
              x={node.x} 
              y={node.y}
              draggable
              onClick={(e) => {
                // stop event from bubbling up to stage
                e.cancelBubble = true;
                selectNode(node.id)
              }}
              onDragMove={(e) => {
                 // optionally update during drag, but for max performance we usually update onDragEnd.
                 // We will update here so properties panel updates live. Zustand helps with performance here.
                 updateNode(node.id, { x: e.target.x(), y: e.target.y() })
              }}
            >
              <Rect
                width={node.width}
                height={node.height}
                fill={node.color}
                cornerRadius={8}
                shadowColor="black"
                shadowBlur={10}
                shadowOpacity={0.3}
                shadowOffset={{ x: 0, y: 5 }}
                stroke={selectedNodeIds.includes(node.id) ? '#646cff' : 'transparent'}
                strokeWidth={selectedNodeIds.includes(node.id) ? 3 : 0}
              />
              <Text 
                text={node.label} 
                fill="white" 
                align="center" 
                verticalAlign="middle"
                width={node.width}
                height={node.height}
                fontFamily="Inter"
                fontSize={14}
                fontStyle="500"
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
