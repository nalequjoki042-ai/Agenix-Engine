import { create } from 'zustand'
import { LogicTextItem } from '../types/logic'
import { ObjectClass } from '../types/objectClass'

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
  className?: string; // legacy or stylistic class name
  classId: string | null;

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
  objectClasses: ObjectClass[]

  // Actions
  addObject: (obj: GameObject) => void
  updateObject: (id: string, updates: Partial<GameObject>) => void
  removeObject: (id: string) => void
  selectObject: (id: string | null, multi?: boolean) => void
  selectLogicItem: (id: string | null) => void
  setCamera: (camera: Partial<CanvasState['camera']>) => void
  setObjects: (objects: GameObject[]) => void
  setScene: (objects: GameObject[], logicItems: LogicTextItem[], objectClasses?: ObjectClass[]) => void

  addLogicItem: (input?: Partial<LogicTextItem>) => void
  updateLogicItem: (id: string, patch: Partial<LogicTextItem>) => void
  deleteLogicItem: (id: string) => void
  linkLogicToObject: (logicId: string, objectId: string) => void
  unlinkLogicFromObject: (logicId: string, objectId: string) => void

  // Object Class Actions
  createObjectClass: (input?: Partial<ObjectClass>) => void
  updateObjectClass: (id: string, patch: Partial<ObjectClass>) => void
  deleteObjectClass: (id: string) => void
  assignClassToObject: (objectId: string, classId: string) => void
  reapplyMissingClassDefaults: (objectId: string) => void
  unassignClassFromObject: (objectId: string) => void
}

function causesCycle(childId: string, proposedParentId: string | null, objectClasses: ObjectClass[]): boolean {
  if (!proposedParentId) return false;
  if (childId === proposedParentId) return true;

  let currentParentId: string | null = proposedParentId;
  const visited = new Set<string>();

  while (currentParentId) {
    if (currentParentId === childId) return true;
    if (visited.has(currentParentId)) return true;
    visited.add(currentParentId);

    const parentCls = objectClasses.find(c => c.id === currentParentId);
    if (!parentCls) break;
    currentParentId = parentCls.parentClassId || null;
  }

  return false;
}

function resolveInheritedClass(classId: string, objectClasses: ObjectClass[]): Partial<ObjectClass> | null {
  const visited = new Set<string>();
  let currentClassId: string | null = classId;
  const chain: ObjectClass[] = [];

  while (currentClassId) {
    if (visited.has(currentClassId)) {
      console.warn(`[Agenix Inheritance] Cyclic inheritance detected at class ${currentClassId}. Breaking loop.`);
      break;
    }
    visited.add(currentClassId);
    
    const cls = objectClasses.find(c => c.id === currentClassId);
    if (!cls) break;
    
    chain.push(cls);
    currentClassId = cls.parentClassId || null;
  }

  if (chain.length === 0) return null;

  chain.reverse();

  let resolvedDescription = '';
  let resolvedTags: string[] = [];
  const resolvedProperties: Record<string, unknown> = {};
  let resolvedBaseType: 'box' | 'zone' | 'unit' | 'custom' = 'box';

  chain.forEach(cls => {
    if (cls.defaultDescription && cls.defaultDescription.trim() !== '') {
      resolvedDescription = cls.defaultDescription;
    }
    if (cls.defaultTags && cls.defaultTags.length > 0) {
      resolvedTags = [...new Set([...resolvedTags, ...cls.defaultTags])];
    }
    if (cls.defaultProperties) {
      Object.assign(resolvedProperties, cls.defaultProperties);
    }
    if (cls.baseType) {
      resolvedBaseType = cls.baseType;
    }
  });

  return {
    defaultDescription: resolvedDescription,
    defaultTags: resolvedTags,
    defaultProperties: resolvedProperties,
    baseType: resolvedBaseType
  };
}

function applyMissingClassDefaults(
  object: GameObject,
  resolvedClass: Partial<ObjectClass>,
  nextClassId?: string | null
): GameObject {
  const description = (object.description && object.description.trim() !== '')
    ? object.description
    : (resolvedClass.defaultDescription || object.description);

  const tags = [...new Set([...(object.tags || []), ...(resolvedClass.defaultTags || [])])];

  const properties = { ...(object.properties || {}) };
  Object.entries(resolvedClass.defaultProperties || {}).forEach(([key, value]) => {
    if (!(key in properties)) {
      properties[key] = value;
    }
  });

  return {
    ...object,
    classId: nextClassId !== undefined ? nextClassId : object.classId,
    description,
    tags,
    properties
  };
}

export const useCanvasStore = create<CanvasState>((set) => ({
  objects: [],
  selectedObjectIds: [],
  camera: { x: 0, y: 0, scale: 1 },
  logicItems: [],
  selectedLogicItemId: null,
  objectClasses: [],

  addObject: (obj) => set((state) => ({ objects: [...state.objects, obj] })),

  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map(o => o.id === id ? { ...o, ...updates } : o)
  })),

  removeObject: (id) => set((state) => {
    const objToRemove = state.objects.find(o => o.id === id);
    const cleanedLogicItems = state.logicItems.map(item => {
      if (item.relatedObjectIds.includes(id)) {
        return { ...item, relatedObjectIds: item.relatedObjectIds.filter(oid => oid !== id) };
      }
      return item;
    });

    const itemsCleaned = cleanedLogicItems.filter((item, i) => item !== state.logicItems[i]).length;
    if (itemsCleaned > 0) {
      console.info(`[Agenix Cleanup] Object "${objToRemove?.name}" (${id}) deleted. Removed its ID from ${itemsCleaned} logic rule(s).`);
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

  setScene: (objects, logicItems, objectClasses = []) => set({
    objects,
    logicItems,
    objectClasses,
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
  })),

  createObjectClass: (input) => set((state) => {
    const newClass: ObjectClass = {
      id: input?.id || crypto.randomUUID(),
      name: input?.name || 'New Object Class',
      description: input?.description || '',
      baseType: input?.baseType || 'box',
      defaultTags: input?.defaultTags ? [...new Set(input.defaultTags)] : [],
      defaultProperties: input?.defaultProperties || {},
      defaultDescription: input?.defaultDescription || '',
      parentClassId: input?.parentClassId || null,
    };
    return { objectClasses: [...state.objectClasses, newClass] };
  }),

  updateObjectClass: (id, patch) => set((state) => {
    const cleanPatch = { ...patch };
    if (cleanPatch.parentClassId !== undefined && causesCycle(id, cleanPatch.parentClassId, state.objectClasses)) {
      console.warn(`[Agenix] Cyclic class inheritance detected. Parent assignment blocked.`);
      delete cleanPatch.parentClassId;
    }

    return {
      objectClasses: state.objectClasses.map(cls =>
        cls.id === id ? { ...cls, ...cleanPatch } : cls
      )
    };
  }),

  deleteObjectClass: (id) => set((state) => ({
    objectClasses: state.objectClasses.filter(cls => cls.id !== id),
    objects: state.objects.map(obj =>
      obj.classId === id ? { ...obj, classId: null } : obj
    )
  })),

  assignClassToObject: (objectId, classId) => set((state) => {
    const resolvedClass = resolveInheritedClass(classId, state.objectClasses);
    if (!resolvedClass) {
      return {
        objects: state.objects.map(obj =>
          obj.id === objectId ? { ...obj, classId } : obj
        )
      };
    }

    return {
      objects: state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        return applyMissingClassDefaults(obj, resolvedClass, classId);
      })
    };
  }),

  reapplyMissingClassDefaults: (objectId) => set((state) => {
    const targetObject = state.objects.find(obj => obj.id === objectId);
    if (!targetObject || !targetObject.classId) {
      return {};
    }

    const resolvedClass = resolveInheritedClass(targetObject.classId, state.objectClasses);
    if (!resolvedClass) {
      console.warn(`[Agenix Class] Cannot reapply defaults: class "${targetObject.classId}" not found.`);
      return {};
    }

    return {
      objects: state.objects.map(obj =>
        obj.id === objectId
          ? applyMissingClassDefaults(obj, resolvedClass)
          : obj
      )
    };
  }),

  unassignClassFromObject: (objectId) => set((state) => ({
    objects: state.objects.map(obj =>
      obj.id === objectId ? { ...obj, classId: null } : obj
    )
  }))
}))
