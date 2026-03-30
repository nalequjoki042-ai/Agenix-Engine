import React from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { FileText, Plus, Trash2, CheckSquare, Square } from 'lucide-react';

export const LogicPanel: React.FC = () => {
  const { logicItems, addLogicItem, updateLogicItem, deleteLogicItem, objects, linkLogicToObject, unlinkLogicFromObject, selectedLogicItemId, selectLogicItem } = useCanvasStore();

  const selectedItem = logicItems.find(item => item.id === selectedLogicItemId);

  const handleAdd = () => {
    const newId = crypto.randomUUID();
    addLogicItem({ id: newId, title: 'New Logic Rule' });
    selectLogicItem(newId);
  };

  const handleDelete = (id: string) => {
    deleteLogicItem(id);
    if (selectedLogicItemId === id) selectLogicItem(null);
  };

  const InputStyle = { 
    width: '100%', 
    padding: '6px', 
    background: 'rgba(255,255,255,0.1)', 
    border: 'none', 
    borderRadius: 4, 
    color: 'white', 
    marginTop: 4, 
    boxSizing: 'border-box' as const 
  };
  const LabelStyle = { fontSize: 12, color: '#888' };

  return (
    <div 
      className="engine-glass"
      style={{
        position: 'absolute',
        left: 300,
        right: 360,
        bottom: 20,
        height: 250,
        padding: 20,
        borderRadius: 12,
        pointerEvents: 'auto',
        display: 'flex',
        gap: 20
      }}
    >
      {/* LEFT LIST */}
      <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 10, borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} />
            <h3 style={{ margin: 0 }}>Logic Rules</h3>
          </div>
          <button onClick={handleAdd} style={{ background: 'var(--accent-color)', border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
            <Plus size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {logicItems.length === 0 ? (
            <div style={{ fontSize: 14, color: '#888', marginTop: 10 }}>No logic rules yet.</div>
          ) : (
            logicItems.map(item => (
              <div 
                key={item.id}
                onClick={() => selectLogicItem(item.id)}
                style={{
                  padding: '8px',
                  background: selectedLogicItemId === item.id ? 'var(--accent-color)' : 'rgba(0,0,0,0.2)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: item.enabled ? 1 : 0.6
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}>{item.title}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  style={{ background: 'transparent', border: 'none', color: selectedLogicItemId === item.id ? 'white' : '#ff6b6b', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDITOR */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: 10 }}>
        {selectedItem ? (
          <div style={{ display: 'flex', gap: 20, height: '100%' }}>
            {/* MAIN FIELDS */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span style={LabelStyle}>TITLE</span>
                  <input 
                    type="text" 
                    value={selectedItem.title} 
                    onChange={e => updateLogicItem(selectedItem.id, { title: e.target.value })}
                    style={InputStyle}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
                  <input 
                    type="checkbox" 
                    checked={selectedItem.enabled}
                    onChange={e => updateLogicItem(selectedItem.id, { enabled: e.target.checked })}
                  />
                  <span style={LabelStyle}>ENABLED</span>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={LabelStyle}>LOGIC TEXT (RUSSIAN SUPPORTED)</span>
                <textarea 
                  value={selectedItem.text} 
                  onChange={e => updateLogicItem(selectedItem.id, { text: e.target.value })}
                  style={{ ...InputStyle, flex: 1, resize: 'none', fontFamily: 'monospace' }}
                  placeholder="Опишите логику здесь..."
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={LabelStyle}>TAGS (comma separated)</span>
                  <input 
                    type="text" 
                    value={selectedItem.tags?.join(', ') || ''} 
                    onChange={e => updateLogicItem(selectedItem.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    style={InputStyle}
                    placeholder="e.g. combat, dialogue"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={LabelStyle}>NOTES</span>
                  <input 
                    type="text" 
                    value={selectedItem.notes || ''} 
                    onChange={e => updateLogicItem(selectedItem.id, { notes: e.target.value })}
                    style={InputStyle}
                    placeholder="Internal notes..."
                  />
                </div>
              </div>
            </div>

            {/* RELATED OBJECTS */}
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
              <span style={{ ...LabelStyle, fontWeight: 'bold', marginBottom: 8, display: 'block' }}>RELATED OBJECTS</span>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {objects.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#888' }}>No objects in scene.</div>
                ) : (
                  objects.map(obj => {
                    const isLinked = selectedItem.relatedObjectIds.includes(obj.id);
                    return (
                      <div 
                        key={obj.id}
                        onClick={() => {
                          if (isLinked) unlinkLogicFromObject(selectedItem.id, obj.id);
                          else linkLogicToObject(selectedItem.id, obj.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '4px 8px',
                          background: isLinked ? 'rgba(255,255,255,0.1)' : 'transparent',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        {isLinked ? <CheckSquare size={14} /> : <Square size={14} opacity={0.5} />}
                        <span style={{ fontSize: 14 }}>{obj.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            Select a logic rule to edit, or create a new one.
          </div>
        )}
      </div>
    </div>
  );
};
