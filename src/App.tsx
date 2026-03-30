import { useState, useEffect, useRef } from 'react'
import { EngineCanvas } from './components/canvas/EngineCanvas'
import { useUIStore } from './store/useUIStore'
import { useCanvasStore } from './store/useCanvasStore'
import { Box, Play, Download, Upload, Square, ListTree, User, Hexagon, FileText, Library } from 'lucide-react'

import { Inspector } from './components/Inspector'
import { LogicPanel } from './components/LogicPanel'
import { ClassPanel } from './components/ClassPanel'

import { validateAndFilterScene } from './utils/sceneValidation'

function App() {
  const [activeBottomPanel, setActiveBottomPanel] = useState<'logic' | 'classes'>('logic')
  const { contextMenu, closeContextMenu } = useUIStore()
  const { addObject, selectedObjectIds, objects, selectObject, setScene, logicItems, objectClasses } = useCanvasStore()
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const sceneData = { objects, logicItems, objectClasses }
    const data = JSON.stringify(sceneData, null, 2)
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
        
        const { objects: validObjects, logicItems: validLogicItems, objectClasses: validObjectClasses, report } = validateAndFilterScene(parsed)
        
        console.groupCollapsed(`[Agenix Import] Scene imported: ${report.valid} objects, ${report.logicValid} logic rules, ${report.classesValid} classes`);
        if (report.discarded > 0) console.warn(`[Agenix Import] Discarded invalid objects: ${report.discarded}`);
        if (report.logicDiscarded > 0) console.warn(`[Agenix Import] Discarded invalid logic items: ${report.logicDiscarded}`);
        if (report.classesDiscarded > 0) console.warn(`[Agenix Import] Discarded invalid classes: ${report.classesDiscarded}`);
        if (report.danglingRefsRemoved) {
          console.info(`[Agenix Cleanup] Removed ${report.danglingRefsRemoved} broken logic links during sanitization.`);
        }
        
        if (report.duplicateIds.length > 0) {
          console.warn('[Agenix Import] Duplicate IDs found and resolved:', report.duplicateIds);
        }
        if (report.brokenParents.length > 0) {
          console.warn('[Agenix Import] Broken parent references detected:', report.brokenParents);
        }
        if (report.brokenChildren.length > 0) {
          console.warn('[Agenix Import] Broken children references detected:', report.brokenChildren);
        }
        
        console.groupEnd();

        setScene(validObjects, validLogicItems, validObjectClasses);
        
        // Show a brief summary to user
        const hasWarnings = report.discarded > 0 || report.logicDiscarded > 0 || report.classesDiscarded > 0 || report.brokenParents.length > 0 || report.brokenChildren.length > 0 || (report.danglingRefsRemoved ?? 0) > 0;
        if (hasWarnings) {
          alert(`Import successful with warnings. Check console for details.\n- Valid objects: ${report.valid}\n- Discarded objects: ${report.discarded}\n- Valid logic items: ${report.logicValid}\n- Discarded logic items: ${report.logicDiscarded}\n- Valid classes: ${report.classesValid}\n- Discarded classes: ${report.classesDiscarded}${report.danglingRefsRemoved ? `\n- Dangling refs cleaned: ${report.danglingRefsRemoved}` : ''}`);
        }
      } catch (err: any) {
        console.error('Failed to import scene', err)
        alert(`Import failed: ${err.message || 'Invalid JSON file.'}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }




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
      classId: null,
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
            id="import-file"
            name="importFile"
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

        <div style={{ position: 'absolute', bottom: 370, left: 300, display: 'flex', gap: 2, pointerEvents: 'auto', zIndex: 10 }}>
          <button 
            onClick={() => setActiveBottomPanel('logic')} 
            style={{ 
              background: activeBottomPanel === 'logic' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)', 
              backdropFilter: 'blur(10px)',
              padding: '8px 16px', 
              borderRadius: '8px 8px 0 0', 
              border: 'none', 
              color: activeBottomPanel === 'logic' ? 'white' : '#888', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: activeBottomPanel === 'logic' ? 'bold' : 'normal',
              borderBottom: activeBottomPanel === 'logic' ? '2px solid var(--accent-color)' : 'none'
            }}
          >
            <FileText size={16} /> Logic Rules
          </button>
          <button 
            onClick={() => setActiveBottomPanel('classes')} 
            style={{ 
              background: activeBottomPanel === 'classes' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)', 
              backdropFilter: 'blur(10px)',
              padding: '8px 16px', 
              borderRadius: '8px 8px 0 0', 
              border: 'none', 
              color: activeBottomPanel === 'classes' ? 'white' : '#888', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: activeBottomPanel === 'classes' ? 'bold' : 'normal',
              borderBottom: activeBottomPanel === 'classes' ? '2px solid var(--accent-color)' : 'none'
            }}
          >
            <Library size={16} /> Object Classes
          </button>
        </div>

        {activeBottomPanel === 'logic' ? <LogicPanel /> : <ClassPanel />}

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
