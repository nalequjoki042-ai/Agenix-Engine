import React, { useState, useMemo } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { FileText, Plus, Trash2, CheckSquare, Square } from 'lucide-react';

export const LogicPanel: React.FC = () => {
  const { logicItems, addLogicItem, updateLogicItem, deleteLogicItem, objects, linkLogicToObject, unlinkLogicFromObject, selectedLogicItemId, selectLogicItem } = useCanvasStore();

  const selectedItem = logicItems.find(item => item.id === selectedLogicItemId);

  const [searchQuery, setSearchQuery] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [objectFilter, setObjectFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    logicItems.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [logicItems]);

  const filteredItems = useMemo(() => {
    return logicItems.filter(item => {
      // 1. Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(q) ||
          item.text.toLowerCase().includes(q) ||
          (item.notes || '').toLowerCase().includes(q) ||
          (item.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // 2. Enabled filter
      if (enabledFilter === 'enabled' && !item.enabled) return false;
      if (enabledFilter === 'disabled' && item.enabled) return false;

      // 3. Object filter
      if (objectFilter !== 'all' && !item.relatedObjectIds.includes(objectFilter)) return false;

      // 4. Tag filter
      if (tagFilter !== 'all' && !(item.tags || []).includes(tagFilter)) return false;

      return true;
    });
  }, [logicItems, searchQuery, enabledFilter, objectFilter, tagFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setEnabledFilter('all');
    setObjectFilter('all');
    setTagFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || enabledFilter !== 'all' || objectFilter !== 'all' || tagFilter !== 'all';

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
            <FileText size={20} />
            <h3 style={{ margin: 0 }}>Logic Rules</h3>
          </div>
          <button onClick={handleAdd} style={{ background: 'var(--accent-color)', border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
            <Plus size={16} />
          </button>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <input
            id="logic-search"
            name="logicSearch"
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...InputStyle, marginTop: 0 }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <select
              id="logic-filter-enabled"
              name="logicFilterEnabled"
              value={enabledFilter}
              onChange={e => setEnabledFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
              style={{ ...InputStyle, marginTop: 0, padding: '4px 2px', flex: 1, fontSize: 13 }}
            >
              <option value="all" style={{ color: 'black' }}>Status: All</option>
              <option value="enabled" style={{ color: 'black' }}>Enabled</option>
              <option value="disabled" style={{ color: 'black' }}>Disabled</option>
            </select>
            <select
              id="logic-filter-tag"
              name="logicFilterTag"
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              style={{ ...InputStyle, marginTop: 0, padding: '4px 2px', flex: 1, fontSize: 13 }}
            >
              <option value="all" style={{ color: 'black' }}>Tag: All</option>
              {availableTags.map(tag => <option key={tag} value={tag} style={{ color: 'black' }}>{tag}</option>)}
            </select>
          </div>
          <select
            id="logic-filter-object"
            name="logicFilterObject"
            value={objectFilter}
            onChange={e => setObjectFilter(e.target.value)}
            style={{ ...InputStyle, marginTop: 0, padding: '4px 2px', fontSize: 13 }}
          >
            <option value="all" style={{ color: 'black' }}>Object: All</option>
            {objects.map(obj => <option key={obj.id} value={obj.id} style={{ color: 'black' }}>{obj.name}</option>)}
          </select>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ff6b6b', borderRadius: 4, cursor: 'pointer', padding: '4px', fontSize: 12 }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {logicItems.length === 0 ? (
            <div style={{ fontSize: 14, color: '#888', marginTop: 10 }}>No logic rules yet.</div>
          ) : filteredItems.length === 0 ? (
            <div style={{ fontSize: 14, color: '#888', marginTop: 10 }}>No rules match filters.</div>
          ) : (
            filteredItems.map(item => (
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
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}>{item.title}</span>
                  {(item.tags && item.tags.length > 0) && (
                    <span style={{ fontSize: 10, color: selectedLogicItemId === item.id ? 'rgba(255,255,255,0.7)' : '#888', marginTop: 2 }}>
                      {item.tags.join(', ')}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  style={{ background: 'transparent', border: 'none', color: selectedLogicItemId === item.id ? 'white' : '#ff6b6b', cursor: 'pointer', padding: 0, flexShrink: 0, marginLeft: 8 }}
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
                    id="logic-title"
                    name="logicTitle"
                    type="text"
                    value={selectedItem.title}
                    onChange={e => updateLogicItem(selectedItem.id, { title: e.target.value })}
                    style={InputStyle}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
                  <input
                    id="logic-enabled"
                    name="logicEnabled"
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
                  id="logic-text"
                  name="logicText"
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
                    id="logic-tags"
                    name="logicTags"
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
                    id="logic-notes"
                    name="logicNotes"
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

