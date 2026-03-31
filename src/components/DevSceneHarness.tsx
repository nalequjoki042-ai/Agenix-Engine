import React, { useState } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { validateAndFilterScene } from '../utils/sceneValidation';
import { X, Code, Play, RefreshCw, AlertTriangle } from 'lucide-react';

export const DevSceneHarness: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [textValue, setTextValue] = useState('');
  
  const { setScene } = useCanvasStore();
  
  const handleLoadCurrent = () => {
    const state = useCanvasStore.getState();
    const sceneData = { 
      objects: state.objects, 
      logicItems: state.logicItems, 
      objectClasses: state.objectClasses 
    };
    setTextValue(JSON.stringify(sceneData, null, 2));
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(textValue);
      const { objects, logicItems, objectClasses, report } = validateAndFilterScene(parsed);
      
      console.groupCollapsed(`[DevHarness] Scene imported: ${report.valid} objects, ${report.logicValid} logic rules, ${report.classesValid} classes`);
      console.log('Report:', report);
      console.groupEnd();
      
      setScene(objects, logicItems, objectClasses);
      alert('Applied successfully. Check console for details.');
    } catch (err: any) {
      console.error('[DevHarness] JSON Parse / Validation Error', err);
      alert(`Error applying JSON: ${err.message}`);
    }
  };

  const mutateAndSet = (mutator: (data: any) => any) => {
    try {
      let data = textValue ? JSON.parse(textValue) : {
        objects: useCanvasStore.getState().objects,
        logicItems: useCanvasStore.getState().logicItems,
        objectClasses: useCanvasStore.getState().objectClasses,
      };
      data = mutator(data);
      setTextValue(JSON.stringify(data, null, 2));
    } catch (err) {
      alert('Invalid JSON in textarea');
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 9999,
          pointerEvents: 'auto',
          background: 'rgba(255,100,0,0.8)', color: 'white', border: 'none', 
          padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
        }}
      >
        <Code size={14} /> Dev JSON
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, width: 600, height: 500,
      background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,100,0,0.5)', borderRadius: 8,
      zIndex: 9999, display: 'flex', flexDirection: 'column', color: 'white',
      pointerEvents: 'auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FF7B00', fontWeight: 'bold', fontSize: 14 }}>
          <AlertTriangle size={16} /> DEV SCENE HARNESS
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><X size={16} /></button>
      </div>

      <div style={{ padding: 8, display: 'flex', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={handleLoadCurrent} style={btnStyle}><RefreshCw size={14}/> Load Current Scene</button>
        <button onClick={handleApply} style={{...btnStyle, color: '#4CAF50', borderColor: '#4CAF50'}}><Play size={14}/> Apply JSON</button>
      </div>

      <div style={{ padding: 8, display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button style={mutStyle} onClick={() => mutateAndSet(d => {
          if (d.logicItems && d.logicItems.length > 0) d.logicItems[0].relatedObjectIds.push('broken-id');
          return d;
        })}>Inject Broken relatedObjectId</button>
        
        <button style={mutStyle} onClick={() => mutateAndSet(d => {
          if (d.objects && d.objects.length > 0) d.objects[0].classId = 'broken-class';
          return d;
        })}>Inject Broken classId</button>

        <button style={mutStyle} onClick={() => mutateAndSet(d => {
          if (d.objectClasses && d.objectClasses.length > 0) d.objectClasses[0].parentClassId = 'broken-parent';
          return d;
        })}>Inject Broken parentClassId</button>

        <button style={mutStyle} onClick={() => mutateAndSet(d => d.objects || [])}>To Legacy Array</button>
        <button style={mutStyle} onClick={() => mutateAndSet(d => { d.objectClasses = []; return d; })}>Clear Classes</button>
        <button style={mutStyle} onClick={() => mutateAndSet(d => { d.logicItems = []; return d; })}>Clear Logic</button>
      </div>

      <textarea 
        value={textValue}
        onChange={e => setTextValue(e.target.value)}
        style={{
          flex: 1, background: '#1e1e1e', color: '#d4d4d4', border: 'none', 
          fontFamily: 'monospace', padding: 12, resize: 'none', outline: 'none'
        }}
        placeholder="Paste scene JSON here..."
      />
    </div>
  );
};

const btnStyle = {
  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
  color: 'white', padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
};

const mutStyle = {
  background: 'rgba(255,100,0,0.1)', border: '1px solid rgba(255,100,0,0.3)', 
  color: '#FF7B00', padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
  fontSize: 11
};
