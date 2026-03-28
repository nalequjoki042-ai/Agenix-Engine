import React, { useEffect, useState } from 'react'
import { EngineCanvas } from './components/canvas/EngineCanvas'
import { useUIStore } from './store/useUIStore'
import { useCanvasStore } from './store/useCanvasStore'
import { Plus, Box, Play, Download, Square, Code, Settings } from 'lucide-react'

function App() {
  const { contextMenu, closeContextMenu } = useUIStore()
  const { addNode, selectedNodeIds, nodes, updateNode } = useCanvasStore()
  
  // Properties panel state (for demonstration)
  const selectedNode = nodes.find(n => n.id === selectedNodeIds[0])

  // Context Menu Actions
  const handleCreateObject = (type: 'cube' | 'trigger') => {
    if (!contextMenu) return
    const id = Math.random().toString(36).substr(2, 9)
    const color = type === 'cube' ? '#4CAF50' : 'rgba(255, 100, 100, 0.5)'
    
    addNode({
      id,
      type: 'object',
      x: contextMenu.canvasX,
      y: contextMenu.canvasY,
      width: 100,
      height: 100,
      color: type === 'cube' ? '#646cff' : color, // Default engine accent
      label: type === 'cube' ? 'Cube' : 'Trigger'
    })
    closeContextMenu()
  }

  // Close context menu on any click outside
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu()
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [closeContextMenu])

  return (
    <div className="engine-layout">
      {/* 2D CANVAS LAYER */}
      <EngineCanvas />

      {/* UI LAYER (Properties, Toolbars, Menus) */}
      <div className="ui-layer">
        
        {/* Top Toolbar */}
        <div className="toolbar engine-glass">
          <button className="active"><Box size={16} /> Edit</button>
          <button><Play size={16} fill="currentColor" /> Play</button>
          <div style={{width: 1, height: 20, background: 'rgba(255,255,255,0.2)', margin: '0 8px'}}></div>
          <button><Download size={16} /> Export</button>
        </div>

        {/* Properties Panel (Right side) */}
        {selectedNode && (
          <div 
            className="engine-glass"
            style={{
              position: 'absolute',
              right: 20,
              top: 20,
              width: 300,
              padding: 20,
              borderRadius: 12,
              pointerEvents: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Settings size={20} />
              <h3 style={{ margin: 0 }}>Properties</h3>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>OBJECT NAME</div>
              <div style={{ fontWeight: 600 }}>{selectedNode.label}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
               <div>
                 <span style={{ fontSize: 12, color: '#888' }}>X:</span>
                 <input 
                   type="number" 
                   value={Math.round(selectedNode.x)} 
                   onChange={(e) => updateNode(selectedNode.id, { x: Number(e.target.value) })}
                   style={{ width: '100%', padding: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: 'white', marginTop: 4 }}
                 />
               </div>
               <div>
                 <span style={{ fontSize: 12, color: '#888' }}>Y:</span>
                 <input 
                   type="number" 
                   value={Math.round(selectedNode.y)} 
                   onChange={(e) => updateNode(selectedNode.id, { y: Number(e.target.value) })}
                   style={{ width: '100%', padding: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: 'white', marginTop: 4 }}
                 />
               </div>
            </div>

            {/* AI Core Component (Placeholder for later) */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#a8b1ff' }}>
                <Code size={16} />
                <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>AI BEHAVIOR</span>
              </div>
              <textarea 
                placeholder="Например: Этот куб должен прыгать при клике..."
                style={{
                  width: '100%',
                  height: 100,
                  padding: 12,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(100,108,255,0.3)',
                  borderRadius: 8,
                  color: 'white',
                  resize: 'none',
                  fontFamily: 'inherit',
                  fontSize: 14
                }}
              />
              <button 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: 'var(--accent-color)', 
                  border: 'none', 
                  borderRadius: 6,
                  color: 'white',
                  fontWeight: 600,
                  marginTop: 10,
                  cursor: 'pointer'
                }}
              >
                Let AI Think 🤖
              </button>
            </div>

          </div>
        )}

        {/* Dynamic Context Menu */}
        {contextMenu && contextMenu.isOpen && (
          <div 
            className="context-menu engine-glass"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onContextMenu={e => e.preventDefault()}
          >
            <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); handleCreateObject('cube') }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Square size={14} /> Create Object</span>
            </div>
            <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); handleCreateObject('trigger') }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Box size={14} /> Create Trigger</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
