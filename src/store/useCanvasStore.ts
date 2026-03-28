import { create } from 'zustand'

export type LogicRef = {
  id: string;
  name: string;
  type: 'server' | 'client' | 'shared';
  description?: string;
  enabled: boolean;
};

export type GameObject = {
  id: string;
  name: string;
  type: 'box' | 'zone' | 'unit' | 'custom';
  className?: string;

  parentId: string | null;
  childrenIds: string[];

  tags: string[];

  transform: {
    x: number;
    y: number;
    z?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  };

  properties: Record<string, unknown>;
  logicRefs: LogicRef[];
  description?: string;

  // Visual/Editor properties for v1 prototype
  width: number;
  height: number;
  color: string;
};

interface CanvasState {
  objects: GameObject[]
  selectedObjectIds: string[]
  camera: { x: number; y: number; scale: number }
  
  // Actions
  addObject: (obj: GameObject) => void
  updateObject: (id: string, updates: Partial<GameObject>) => void
  removeObject: (id: string) => void
  selectObject: (id: string | null, multi?: boolean) => void
  setCamera: (camera: Partial<CanvasState['camera']>) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  objects: [],
  selectedObjectIds: [],
  camera: { x: 0, y: 0, scale: 1 },

  addObject: (obj) => set((state) => ({ objects: [...state.objects, obj] })),
  
  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map(o => o.id === id ? { ...o, ...updates } : o)
  })),

  removeObject: (id) => set((state) => {
    // Also remove from children of its parent? We can keep it simple for now, 
    // but a proper cleanup would be better. Let's keep it simple for this store action.
    return {
      objects: state.objects.filter(o => o.id !== id),
      selectedObjectIds: state.selectedObjectIds.filter(selId => selId !== id)
    };
  }),

  selectObject: (id, multi = false) => set((state) => {
    if (id === null) return { selectedObjectIds: [] }
    if (multi) return { selectedObjectIds: [...new Set([...state.selectedObjectIds, id])] }
    return { selectedObjectIds: [id] }
  }),

  setCamera: (cameraUpdates) => set((state) => ({
    camera: { ...state.camera, ...cameraUpdates }
  }))
}))
