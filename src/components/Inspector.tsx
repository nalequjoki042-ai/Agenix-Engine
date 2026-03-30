import React, { useState } from 'react';
import { useCanvasStore, LogicRef } from '../store/useCanvasStore';
import { Settings, Plus, Trash2, FileText, Link2Off } from 'lucide-react';

export const Inspector: React.FC = () => {
  const { objects, selectedObjectIds, updateObject, removeObject, logicItems, selectLogicItem, addLogicItem, unlinkLogicFromObject, objectClasses } = useCanvasStore();
  
  const selectedObject = objects.find(o => o.id === selectedObjectIds[0]);

  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');

  if (!selectedObject) return null;

  const getDescendantIds = (parentId: string): string[] => {
    const children = objects.filter(o => o.parentId === parentId);
    return children.reduce((acc, child) => {
      return [...acc, child.id, ...getDescendantIds(child.id)];
    }, [] as string[]);
  };

  const descendantIds = getDescendantIds(selectedObject.id);
  const validParents = objects.filter(o => 
    o.id !== selectedObject.id && !descendantIds.includes(o.id)
  );

  const handleAddProperty = () => {
    if (!newPropKey.trim()) return;
    updateObject(selectedObject.id, {
      properties: {
        ...selectedObject.properties,
        [newPropKey]: newPropValue
      }
    });
    setNewPropKey('');
    setNewPropValue('');
  };

  const handleUpdatePropertyKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey.trim()) return;
    const newProps = { ...selectedObject.properties };
    newProps[newKey] = newProps[oldKey];
    delete newProps[oldKey];
    updateObject(selectedObject.id, { properties: newProps });
  };

  const handleUpdatePropertyValue = (key: string, value: string) => {
    updateObject(selectedObject.id, {
      properties: {
        ...selectedObject.properties,
        [key]: value
      }
    });
  };

  const handleRemoveProperty = (key: string) => {
    const newProps = { ...selectedObject.properties };
    delete newProps[key];
    updateObject(selectedObject.id, { properties: newProps });
  };

  const handleAddLogicRef = () => {
    const newRef: LogicRef = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Logic',
      type: 'client',
      description: '',
      enabled: true
    };
    updateObject(selectedObject.id, {
      logicRefs: [...(selectedObject.logicRefs || []), newRef]
    });
  };

  const handleUpdateLogicRef = (id: string, updates: Partial<LogicRef>) => {
    updateObject(selectedObject.id, {
      logicRefs: selectedObject.logicRefs.map(ref => 
        ref.id === id ? { ...ref, ...updates } : ref
      )
    });
  };

  const handleRemoveLogicRef = (id: string) => {
    updateObject(selectedObject.id, {
      logicRefs: selectedObject.logicRefs.filter(ref => ref.id !== id)
    });
  };

  const handleCreateTextLogic = () => {
    const newId = crypto.randomUUID();
    addLogicItem({ 
      id: newId, 
      title: 'New Scenario Rule', 
      relatedObjectIds: [selectedObject.id] 
    });
    selectLogicItem(newId);
  };

  const relatedLogicItems = logicItems.filter(item => item.relatedObjectIds.includes(selectedObject.id));

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, marginTop: 16, fontWeight: 'bold' }}>
      {title.toUpperCase()}
    </div>
  );

  const InputStyle = { width: '100%', padding: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: 'white', marginTop: 4, boxSizing: 'border-box' as const };
  const LabelStyle = { fontSize: 12, color: '#888' };

  return (
    <div 
      key={selectedObject.id}
      className="engine-glass"
      style={{
        position: 'absolute',
        right: 20,
        top: 20,
        bottom: 20,
        width: 320,
        padding: 20,
        borderRadius: 12,
        pointerEvents: 'auto',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Settings size={20} />
        <h3 style={{ margin: 0, flex: 1 }}>Inspector</h3>
        <button 
          onClick={() => { if (confirm(`Delete "${selectedObject.name}"?`)) removeObject(selectedObject.id); }}
          style={{ background: 'transparent', border: '1px solid rgba(255,100,100,0.4)', color: '#ff6b6b', borderRadius: 4, cursor: 'pointer', padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
          title="Delete object"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
      
      {/* BASIC Section */}
      <SectionHeader title="Basic" />
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <span style={LabelStyle}>NAME</span>
            <input 
              id="obj-name"
              name="objectName"
              type="text" 
              value={selectedObject.name} 
              onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
              style={InputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <span style={LabelStyle}>TYPE</span>
            <select 
              id="obj-type"
              name="objectType"
              value={selectedObject.type}
              onChange={(e) => updateObject(selectedObject.id, { type: e.target.value as any })}
              style={InputStyle}
            >
              <option value="box">Box</option>
              <option value="zone">Zone</option>
              <option value="unit">Unit</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span style={LabelStyle}>CLASS ID</span>
            <select 
              id="obj-class-id"
              name="objectClassId"
              value={selectedObject.classId || ''} 
              onChange={(e) => updateObject(selectedObject.id, { classId: e.target.value || null })}
              style={InputStyle}
            >
              <option value="">None</option>
              {objectClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span style={LabelStyle}>PARENT</span>
          <select 
            id="obj-parent"
            name="objectParent"
            value={selectedObject.parentId || ''}
            onChange={(e) => updateObject(selectedObject.id, { parentId: e.target.value || null })}
            style={InputStyle}
          >
            <option value="">(No Parent)</option>
            {validParents.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TRANSFORM Section */}
      <SectionHeader title="Transform" />
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <span style={LabelStyle}>X</span>
              <input 
                id="obj-x"
                name="transformX"
                type="number" 
                value={Math.round(selectedObject.transform.x)} 
                onChange={(e) => updateObject(selectedObject.id, { transform: { ...selectedObject.transform, x: Number(e.target.value) } })}
                style={InputStyle}
              />
            </div>
            <div>
              <span style={LabelStyle}>Y</span>
              <input 
                id="obj-y"
                name="transformY"
                type="number" 
                value={Math.round(selectedObject.transform.y)} 
                onChange={(e) => updateObject(selectedObject.id, { transform: { ...selectedObject.transform, y: Number(e.target.value) } })}
                style={InputStyle}
              />
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <span style={LabelStyle}>ROTATION</span>
              <input 
                id="obj-rotation"
                name="transformRotation"
                type="number" 
                value={selectedObject.transform.rotation || 0} 
                onChange={(e) => updateObject(selectedObject.id, { transform: { ...selectedObject.transform, rotation: Number(e.target.value) } })}
                style={InputStyle}
              />
            </div>
            <div>
              <span style={LabelStyle}>SCALE</span>
              <input 
                id="obj-scale"
                name="transformScale"
                type="number" 
                value={selectedObject.transform.scaleX || 1} 
                onChange={(e) => updateObject(selectedObject.id, { transform: { ...selectedObject.transform, scaleX: Number(e.target.value), scaleY: Number(e.target.value) } })}
                style={InputStyle}
              />
            </div>
        </div>
      </div>

      {/* TAGS Section */}
      <SectionHeader title="Tags" />
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
        <span style={LabelStyle}>TAGS (comma separated)</span>
        <input 
          id="obj-tags"
          name="objectTags"
          type="text" 
          value={selectedObject.tags?.join(', ') || ''} 
          onChange={(e) => updateObject(selectedObject.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
          placeholder="e.g. interactive, solid"
          style={InputStyle}
        />
      </div>

      {/* DESCRIPTION Section */}
      <SectionHeader title="Description" />
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
        <textarea 
          id="obj-desc"
          name="objectDescription"
          value={selectedObject.description || ''} 
          onChange={(e) => updateObject(selectedObject.id, { description: e.target.value })}
          placeholder="Object description..."
          rows={3}
          style={{ ...InputStyle, resize: 'vertical' }}
        />
      </div>

      {/* CUSTOM PROPERTIES Section */}
      <SectionHeader title="Custom Properties" />
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
        {Object.entries(selectedObject.properties || {}).map(([key, value]) => (
          <div key={key} style={{ display: 'flex', gap: 4, marginBottom: 8, alignItems: 'center' }}>
            <input 
              id={`prop-key-${key}`}
              name={`propKey_${key}`}
              type="text" 
              defaultValue={key}
              onBlur={(e) => handleUpdatePropertyKey(key, e.target.value)}
              style={{ ...InputStyle, marginTop: 0, flex: 1 }}
              placeholder="Key"
            />
            <input 
              id={`prop-val-${key}`}
              name={`propVal_${key}`}
              type="text" 
              value={String(value)}
              onChange={(e) => handleUpdatePropertyValue(key, e.target.value)}
              style={{ ...InputStyle, marginTop: 0, flex: 1 }}
              placeholder="Value"
            />
            <button 
              onClick={() => handleRemoveProperty(key)}
              style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 4, marginTop: 8, alignItems: 'center' }}>
          <input 
            id="new-prop-key"
            name="newPropKey"
            type="text" 
            value={newPropKey}
            onChange={(e) => setNewPropKey(e.target.value)}
            style={{ ...InputStyle, marginTop: 0, flex: 1 }}
            placeholder="New Key"
          />
          <input 
            id="new-prop-val"
            name="newPropValue"
            type="text" 
            value={newPropValue}
            onChange={(e) => setNewPropValue(e.target.value)}
            style={{ ...InputStyle, marginTop: 0, flex: 1 }}
            placeholder="New Value"
          />
          <button 
            onClick={handleAddProperty}
            style={{ background: 'var(--accent-color)', border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer', padding: '6px' }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* SCENARIO RULES Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <SectionHeader title="Scenario Rules" />
        <button 
          onClick={handleCreateTextLogic}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', fontSize: 12, marginBottom: 8 }}
        >
          + Add
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {relatedLogicItems.map(item => (
          <div key={item.id} style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, borderLeft: item.enabled ? '3px solid #4CAF50' : '3px solid #888' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div 
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => selectLogicItem(item.id)}
              >
                <div style={{ fontSize: 14, fontWeight: 'bold', color: item.enabled ? 'white' : '#888', marginBottom: 4 }}>
                  <FileText size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {item.text || 'No text...'}
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); unlinkLogicFromObject(item.id, selectedObject.id); }}
                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '4px', marginLeft: 8 }}
                title="Unlink from object"
              >
                <Link2Off size={14} />
              </button>
            </div>
            {item.tags && item.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {item.tags.map(tag => (
                   <span key={tag} style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: '#ccc' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {relatedLogicItems.length === 0 && (
          <div style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: '10px 0' }}>
            No scenario rules attached.
          </div>
        )}
      </div>

      {/* LOGIC REFERENCES Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <SectionHeader title="Logic References" />
        <button 
          onClick={handleAddLogicRef}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', fontSize: 12, marginBottom: 8 }}
        >
          + Add
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(selectedObject.logicRefs || []).map(ref => (
          <div key={ref.id} style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, borderLeft: '3px solid #a8b1ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <input 
                id={`ref-name-${ref.id}`}
                name={`refName_${ref.id}`}
                type="text" 
                value={ref.name}
                onChange={(e) => handleUpdateLogicRef(ref.id, { name: e.target.value })}
                style={{ ...InputStyle, marginTop: 0, width: '60%', background: 'transparent', padding: 0, fontSize: 14, fontWeight: 'bold' }}
                placeholder="Logic Name"
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input 
                  id={`ref-enabled-${ref.id}`}
                  name={`refEnabled_${ref.id}`}
                  type="checkbox"
                  checked={ref.enabled}
                  onChange={(e) => handleUpdateLogicRef(ref.id, { enabled: e.target.checked })}
                  title="Enabled"
                />
                <button 
                  onClick={() => handleRemoveLogicRef(ref.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 0 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <select 
                  id={`ref-type-${ref.id}`}
                  name={`refType_${ref.id}`}
                  value={ref.type}
                  onChange={(e) => handleUpdateLogicRef(ref.id, { type: e.target.value as any })}
                  style={InputStyle}
                >
                  <option value="server">Server</option>
                  <option value="client">Client</option>
                  <option value="shared">Shared</option>
                </select>
              </div>
            </div>

            <textarea 
              id={`ref-desc-${ref.id}`}
              name={`refDesc_${ref.id}`}
              value={ref.description || ''}
              onChange={(e) => handleUpdateLogicRef(ref.id, { description: e.target.value })}
              style={{ ...InputStyle, resize: 'vertical' }}
              placeholder="Logic description..."
              rows={2}
            />
          </div>
        ))}
        {(!selectedObject.logicRefs || selectedObject.logicRefs.length === 0) && (
          <div style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: '10px 0' }}>
            No logic references attached.
          </div>
        )}
      </div>

      <div style={{ height: 40 }} /> {/* Bottom padding */}
    </div>
  );
};
