import { useEffect, useRef } from 'react'
import { EngineCanvas } from './components/canvas/EngineCanvas'
import { useUIStore } from './store/useUIStore'
import { useCanvasStore } from './store/useCanvasStore'
import { Box, Play, Download, Upload, Square, Code, Settings, ListTree, User, Hexagon } from 'lucide-react'

import { Inspector } from './components/Inspector'

import { validateAndFilterScene } from './utils/sceneValidation'

function App() {
  const { contextMenu, closeContextMenu } = useUIStore()
  const { addObject, selectedObjectIds, objects, updateObject, selectObject, setObjects } = useCanvasStore()
  
  const selectedObject = objects.find(o => o.id === selectedObjectIds[0])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = JSON.stringify(objects, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scene.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string
        const parsed = JSON.parse(json)
        
        const { objects: validObjects, report } = validateAndFilterScene(parsed)
        
        console.group('Scene Import Report')
        console.log(`Total objects: ${report.total}`)
        console.log(`Valid objects: ${report.valid}`)
        console.log(`Discarded (malformed or duplicate IDs): ${report.discarded}`)
        
        if (report.duplicateIds.length > 0) {
          console.warn('Duplicate IDs found:', report.duplicateIds)
        }
        
        if (report.brokenParents.length > 0) {
          console.warn('Broken parent references:', report.brokenParents)
        }
        
        if (report.brokenChildren.length > 0) {
          console.warn('Broken children references:', report.brokenChildren)
        }
        console.groupEnd()

        setObjects(validObjects)
        
        // Show a brief summary to user
        if (report.discarded > 0 || report.brokenParents.length > 0 || report.brokenChildren.length > 0) {
          alert(`Import successful with warnings. Check console for details.\n- Valid: ${report.valid}\n- Discarded: ${report.discarded}`)
        }
      } catch (err: any) {
        console.error('Failed to import scene', err)
        alert(`Import failed: ${err.message || 'Invalid JSON file.'}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const getDescendantIds = (parentId: string): string[] => {
    const children = objects.filter(o => o.parentId === parentId);
    return children.reduce((acc, child) => {
      return [...acc, child.id, ...getDescendantIds(child.id)];
    }, [] as string[]);
  };

  const descendantIds = selectedObject ? getDescendantIds(selectedObject.id) : [];
  const validParents = objects.filter(o => 
    selectedObject && o.id !== selectedObject.id && !descendantIds.includes(o.id)
  );

  const handleCreateObject = (type: 'box' | 'zone' | 'unit') => {
    if (!contextMenu) return
    const id = Math.random().toString(36).substr(2, 9)
    
    let color = '#646cff';
    if (type === 'zone') color = 'rgba(255, 100, 100, 0.5)';
    if (type === 'unit') color = '#4CAF50';
    
    let name = 'Box';
    if (type === 'zone') name = 'Zone';
    if (type === 'unit') name = 'Unit';

    addObject({
      id,
      name,
      type,
      parentId: null,
      childrenIds: [],
      tags: [],
      transform: {
        x: contextMenu.canvasX,
        y: contextMenu.canvasY,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      },
      properties: {},
      logicRefs: [],
      description: '',
      width: 100,
      height: 100,
      color
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
          <button onClick={handleExport}><Download size={16} /> Export</button>
          <button onClick={handleImportClick}><Upload size={16} /> Import</button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            style={{ display: 'none' }} 
          />
        </div>

        {/* Hierarchy Panel (Left side) */}
        <div 
          className="engine-glass"
          style={{
            position: 'absolute',
            left: 20,
            top: 20,
            bottom: 20,
            width: 260,
            padding: 20,
            borderRadius: 12,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <ListTree size={20} />
            <h3 style={{ margin: 0 }}>Hierarchy</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {objects.length === 0 && <div style={{color: '#888', fontSize: 14}}>No objects in scene</div>}
            
            {/* Render root objects, then their children recursively */}
            {(() => {
              const renderNode = (obj: typeof objects[0], depth: number = 0, visited = new Set<string>()): React.ReactNode => {
                if (visited.has(obj.id)) return null;
                const newVisited = new Set(visited).add(obj.id);
                
                const children = objects.filter(o => o.parentId === obj.id);
                return (
                  <div key={obj.id}>
                    <div 
                      onClick={() => selectObject(obj.id)}
                      style={{
                        padding: '6px 8px',
                        background: selectedObjectIds.includes(obj.id) ? 'var(--accent-color)' : 'transparent',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        marginLeft: depth * 16,
                        transition: 'background 0.2s',
                        border: '1px solid transparent',
                        borderColor: selectedObjectIds.includes(obj.id) ? 'rgba(255,255,255,0.2)' : 'transparent'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = selectedObjectIds.includes(obj.id) ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedObjectIds.includes(obj.id) ? 'var(--accent-color)' : 'transparent'}
                    >
                      {obj.type === 'box' && <Box size={14} />}
                      {obj.type === 'zone' && <Hexagon size={14} />}
                      {obj.type === 'unit' && <User size={14} />}
                      {obj.type === 'custom' && <Square size={14} />}
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{obj.name}</span>
                    </div>
                    {children.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                        {children.map(child => renderNode(child, depth + 1, newVisited))}
                      </div>
                    )}
                  </div>
                );
              };
              return objects.filter(o => !o.parentId).map(obj => renderNode(obj, 0));
            })()}
          </div>
        </div>

        {/* Properties Panel (Right side) */}
        <Inspector />

        {/* Dynamic Context Menu */}
        {contextMenu && contextMenu.isOpen && (
          <div 
            className="context-menu engine-glass"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onContextMenu={e => e.preventDefault()}
          >
            <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); handleCreateObject('box') }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Square size={14} /> Create Box</span>
            </div>
            <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); handleCreateObject('zone') }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Hexagon size={14} /> Create Zone</span>
            </div>
            <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); handleCreateObject('unit') }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} /> Create Unit</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
