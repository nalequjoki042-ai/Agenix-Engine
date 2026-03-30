import { create } from 'zustand'
import { LogicTextItem } from '../types/logic'

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
  logicItems: LogicTextItem[]
  selectedLogicItemId: string | null
  
  // Actions
  addObject: (obj: GameObject) => void
  updateObject: (id: string, updates: Partial<GameObject>) => void
  removeObject: (id: string) => void
  selectObject: (id: string | null, multi?: boolean) => void
  selectLogicItem: (id: string | null) => void
  setCamera: (camera: Partial<CanvasState['camera']>) => void
  setObjects: (objects: GameObject[]) => void
  setScene: (objects: GameObject[], logicItems: LogicTextItem[]) => void

  addLogicItem: (input?: Partial<LogicTextItem>) => void
  updateLogicItem: (id: string, patch: Partial<LogicTextItem>) => void
  deleteLogicItem: (id: string) => void
  linkLogicToObject: (logicId: string, objectId: string) => void
  unlinkLogicFromObject: (logicId: string, objectId: string) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  objects: [],
  selectedObjectIds: [],
  camera: { x: 0, y: 0, scale: 1 },
  logicItems: [],
  selectedLogicItemId: null,

  addObject: (obj) => set((state) => ({ objects: [...state.objects, obj] })),
  
  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map(o => o.id === id ? { ...o, ...updates } : o)
  })),

  removeObject: (id) => set((state) => {
    // Clean up relatedObjectIds in all logicItems when an object is deleted.
    // The logicItem itself is NOT deleted even if relatedObjectIds becomes empty.
    const cleanedLogicItems = state.logicItems.map(item => {
      if (item.relatedObjectIds.includes(id)) {
        return { ...item, relatedObjectIds: item.relatedObjectIds.filter(oid => oid !== id) };
      }
      return item;
    });

    const hadDanglingRefs = cleanedLogicItems.some((item, i) => item !== state.logicItems[i]);
    if (hadDanglingRefs) {
      console.warn(`[Agenix] Object "${id}" removed — cleaned relatedObjectIds in logicItems.`);
    }

    return {
      objects: state.objects.filter(o => o.id !== id),
      selectedObjectIds: state.selectedObjectIds.filter(selId => selId !== id),
      logicItems: cleanedLogicItems
    };
  }),

  selectObject: (id, multi = false) => set((state) => {
    if (id === null) return { selectedObjectIds: [] }
    if (multi) return { selectedObjectIds: [...new Set([...state.selectedObjectIds, id])] }
    return { selectedObjectIds: [id] }
  }),

  selectLogicItem: (id) => set({ selectedLogicItemId: id }),

  setCamera: (cameraUpdates) => set((state) => ({
    camera: { ...state.camera, ...cameraUpdates }
  })),

  setObjects: (objects) => set({ objects, selectedObjectIds: [] }),

  setScene: (objects, logicItems) => set({
    objects,
    logicItems,
    selectedObjectIds: [],
    selectedLogicItemId: null
  }),

  addLogicItem: (input) => set((state) => {
    const newLogic: LogicTextItem = {
      id: input?.id || crypto.randomUUID(),
      title: input?.title || 'New Logic Rule',
      text: input?.text || '',
      relatedObjectIds: input?.relatedObjectIds ? [...new Set(input.relatedObjectIds)] : [],
      enabled: input?.enabled ?? true,
      tags: input?.tags || [],
      notes: input?.notes || '',
    };
    return { logicItems: [...state.logicItems, newLogic] };
  }),

  updateLogicItem: (id, patch) => set((state) => ({
    logicItems: state.logicItems.map(item =>
      item.id === id ? { ...item, ...patch } : item
    )
  })),

  deleteLogicItem: (id) => set((state) => ({
    logicItems: state.logicItems.filter(item => item.id !== id)
  })),

  linkLogicToObject: (logicId, objectId) => set((state) => ({
    logicItems: state.logicItems.map(item => {
      if (item.id === logicId) {
        if (!item.relatedObjectIds.includes(objectId)) {
          return { ...item, relatedObjectIds: [...item.relatedObjectIds, objectId] };
        }
      }
      return item;
    })
  })),

  unlinkLogicFromObject: (logicId, objectId) => set((state) => ({
    logicItems: state.logicItems.map(item => {
      if (item.id === logicId) {
        return {
          ...item,
          relatedObjectIds: item.relatedObjectIds.filter(id => id !== objectId)
        };
      }
      return item;
    })
  }))
}))