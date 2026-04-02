import React, { useState } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { Library, Plus, Trash2, PlusCircle } from 'lucide-react';
import {
  BROKEN_PARENT_OPTION_VALUE,
  getClassParentUiState,
  getInvalidParentSelectionReason
} from '../utils/classParentUi';

export const ClassPanel: React.FC = () => {
  const { objectClasses, createObjectClass, updateObjectClass, deleteObjectClass, createObjectFromClass } = useCanvasStore();
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const selectedClass = objectClasses.find(c => c.id === selectedClassId);

  const [searchQuery, setSearchQuery] = useState('');
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [parentFeedback, setParentFeedback] = useState<string | null>(null);

  const filteredItems = objectClasses.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  const handleAdd = () => {
    const newId = crypto.randomUUID();
    createObjectClass({ id: newId, name: 'New Class' });
    setSelectedClassId(newId);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteObjectClass(id);
    if (selectedClassId === id) setSelectedClassId(null);
    setDeleteConfirmId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
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
  const parentUi = selectedClass ? getClassParentUiState(selectedClass, objectClasses) : null;

  const handleParentChange = (nextParentId: string | null) => {
    if (!selectedClass) return;
    if (nextParentId === BROKEN_PARENT_OPTION_VALUE) return;

    const invalidReason = getInvalidParentSelectionReason(selectedClass.id, nextParentId, objectClasses);
    if (invalidReason === 'self') {
      setParentFeedback('A class cannot be its own parent. Choose another class or None.');
      return;
    }

    if (invalidReason === 'cycle') {
      setParentFeedback('This parent would create an inheritance cycle. Choose another class or None.');
      return;
    }

    setParentFeedback(null);
    updateObjectClass(selectedClass.id, { parentClassId: nextParentId });
  };

  return (
    <div
      className="engine-glass"
      style={{
        position: 'absolute',
        left: 300,
        right: 360,
        bottom: 20,
        height: 350,
        padding: 20,
        borderRadius: '0 12px 12px 12px',
        pointerEvents: 'auto',
        display: 'flex',
        gap: 20
      }}
    >
      {/* LEFT LIST */}
      <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 10, borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Library size={20} />
            <h3 style={{ margin: 0 }}>Classes</h3>
          </div>
          <button onClick={handleAdd} style={{ background: 'var(--accent-color)', border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
            <Plus size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...InputStyle, marginTop: 0 }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {objectClasses.length === 0 ? (
            <div style={{ fontSize: 14, color: '#888', marginTop: 10 }}>No classes yet.</div>
          ) : filteredItems.length === 0 ? (
            <div style={{ fontSize: 14, color: '#888', marginTop: 10 }}>No classes match.</div>
          ) : (
            filteredItems.map(cls => (
              <div
                key={cls.id}
                onClick={() => {
                  setSelectedClassId(cls.id);
                  if (deleteConfirmId) setDeleteConfirmId(null);
                  if (parentFeedback) setParentFeedback(null);
                }}
                style={{
                  padding: '8px',
                  background: selectedClassId === cls.id ? 'var(--accent-color)' : 'rgba(0,0,0,0.2)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: 32
                }}
              >
                {deleteConfirmId === cls.id ? (
                  <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#ff6b6b' }}>Delete?</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={(e) => confirmDelete(cls.id, e)} style={{ background: '#ff6b6b', border: 'none', color: 'white', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Yes</button>
                      <button onClick={cancelDelete} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>No</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}>{cls.name}</span>
                      <span style={{ fontSize: 10, color: selectedClassId === cls.id ? 'rgba(255,255,255,0.7)' : '#888', marginTop: 2 }}>
                        Type: {cls.baseType}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteClick(cls.id, e)}
                      style={{ background: 'transparent', border: 'none', color: selectedClassId === cls.id ? 'white' : '#ff6b6b', cursor: 'pointer', padding: 0, flexShrink: 0, marginLeft: 8 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDITOR */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: 10 }}>
        {selectedClass ? (
          <div style={{ display: 'flex', gap: 20, height: '100%' }}>
            {/* MAIN FIELDS */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span style={LabelStyle}>NAME</span>
                  <input
                    type="text"
                    value={selectedClass.name}
                    onChange={e => updateObjectClass(selectedClass.id, { name: e.target.value })}
                    style={InputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={LabelStyle}>BASE TYPE</span>
                  <select
                    value={selectedClass.baseType}
                    onChange={e => updateObjectClass(selectedClass.id, { baseType: e.target.value as any })}
                    style={InputStyle}
                  >
                    <option value="box" style={{ color: 'black' }}>Box</option>
                    <option value="zone" style={{ color: 'black' }}>Zone</option>
                    <option value="unit" style={{ color: 'black' }}>Unit</option>
                    <option value="custom" style={{ color: 'black' }}>Custom</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={LabelStyle}>PARENT CLASS</span>
                  <select
                    value={parentUi?.selectorValue || ''}
                    onChange={e => handleParentChange(e.target.value || null)}
                    style={InputStyle}
                  >
                    <option value="" style={{ color: 'black' }}>None</option>
                    {parentUi?.brokenParentId ? (
                      <option value={BROKEN_PARENT_OPTION_VALUE} style={{ color: 'black' }}>
                        Broken link ({parentUi.brokenParentId})
                      </option>
                    ) : null}
                    {parentUi?.options.map(option => (
                      <option key={option.id} value={option.id} style={{ color: 'black' }}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.2)', border: parentUi?.linkState === 'Broken Link' ? '1px solid rgba(255,107,107,0.45)' : '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11 }}>
                      <span style={{ color: '#888' }}>Current: <span style={{ color: 'white' }}>{parentUi?.currentParentName || 'None'}</span></span>
                      <span style={{ color: '#888' }}>State: <span style={{ color: parentUi?.linkState === 'Broken Link' ? '#ff9b9b' : 'white' }}>{parentUi?.linkState || 'None'}</span></span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: parentUi?.linkState === 'Broken Link' ? '#ffb3b3' : '#aaa' }}>
                      {parentUi?.note}
                    </div>
                    {parentFeedback ? (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#ffb3b3' }}>
                        {parentFeedback}
                      </div>
                    ) : null}
                    {parentUi?.brokenParentId ? (
                      <button
                        onClick={() => handleParentChange(null)}
                        style={{ marginTop: 8, background: 'rgba(255,107,107,0.18)', border: '1px solid rgba(255,107,107,0.45)', color: '#ffdede', borderRadius: 4, cursor: 'pointer', padding: '4px 8px', fontSize: 11 }}
                      >
                        Clear Broken Link
                      </button>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#888', lineHeight: 1.4 }}>
                    Child inherits missing defaults from the parent chain. Child defaults may override parent values. This is not live destructive sync.
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => createObjectFromClass(selectedClass.id)}
                  style={{
                    width: '100%',
                    background: 'rgba(100,108,255,0.2)',
                    border: '1px solid rgba(100,108,255,0.5)',
                    color: '#cfd3ff',
                    borderRadius: 6,
                    cursor: 'pointer',
                    padding: '8px 10px',
                    fontSize: 12,
                    marginBottom: 12
                  }}
                >
                  Create Object From Class
                </button>
                <span style={LabelStyle}>CLASS DESCRIPTION</span>
                <textarea
                  value={selectedClass.description}
                  onChange={e => updateObjectClass(selectedClass.id, { description: e.target.value })}
                  style={{ ...InputStyle, resize: 'none', height: 60 }}
                  placeholder="What is this class for..."
                />
              </div>

              <div>
                <span style={LabelStyle}>DEFAULT OBJECT DESCRIPTION</span>
                <textarea
                  value={selectedClass.defaultDescription}
                  onChange={e => updateObjectClass(selectedClass.id, { defaultDescription: e.target.value })}
                  style={{ ...InputStyle, resize: 'none', height: 60 }}
                  placeholder="Description given to objects of this class..."
                />
              </div>

              <div>
                <span style={LabelStyle}>DEFAULT TAGS (comma separated)</span>
                <input
                  type="text"
                  value={selectedClass.defaultTags?.join(', ') || ''}
                  onChange={e => updateObjectClass(selectedClass.id, { defaultTags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  style={InputStyle}
                  placeholder="e.g. enemy, flying"
                />
              </div>
            </div>

            {/* DEFAULT PROPERTIES */}
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
              <span style={{ ...LabelStyle, fontWeight: 'bold', marginBottom: 8, display: 'block' }}>DEFAULT PROPERTIES</span>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {Object.entries(selectedClass.defaultProperties || {}).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', gap: 4, marginBottom: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      defaultValue={key}
                      onBlur={(e) => {
                        const newKey = e.target.value;
                        if (newKey === key || !newKey.trim()) return;
                        const newProps = { ...selectedClass.defaultProperties };
                        newProps[newKey] = newProps[key];
                        delete newProps[key];
                        updateObjectClass(selectedClass.id, { defaultProperties: newProps });
                      }}
                      style={{ ...InputStyle, marginTop: 0, flex: 1 }}
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => {
                        updateObjectClass(selectedClass.id, {
                          defaultProperties: { ...selectedClass.defaultProperties, [key]: e.target.value }
                        });
                      }}
                      style={{ ...InputStyle, marginTop: 0, flex: 1 }}
                      placeholder="Value"
                    />
                    <button
                      onClick={() => {
                        const newProps = { ...selectedClass.defaultProperties };
                        delete newProps[key];
                        updateObjectClass(selectedClass.id, { defaultProperties: newProps });
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <div style={{ display: 'flex', gap: 4, marginTop: 12, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newPropKey}
                    onChange={(e) => setNewPropKey(e.target.value)}
                    style={{ ...InputStyle, marginTop: 0, flex: 1 }}
                    placeholder="New Key"
                  />
                  <input
                    type="text"
                    value={newPropValue}
                    onChange={(e) => setNewPropValue(e.target.value)}
                    style={{ ...InputStyle, marginTop: 0, flex: 1 }}
                    placeholder="New Value"
                  />
                  <button
                    onClick={() => {
                      if (!newPropKey.trim()) return;
                      updateObjectClass(selectedClass.id, {
                        defaultProperties: {
                          ...selectedClass.defaultProperties,
                          [newPropKey]: newPropValue
                        }
                      });
                      setNewPropKey('');
                      setNewPropValue('');
                    }}
                    style={{ background: 'var(--accent-color)', border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer', padding: '6px' }}
                  >
                    <PlusCircle size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            Select a class to edit, or create a new one.
          </div>
        )}
      </div>
    </div>
  );
};
