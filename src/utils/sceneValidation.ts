import { GameObject } from '../store/useCanvasStore';
import { LogicTextItem } from '../types/logic';

export interface SceneImportReport {
  total: number;
  valid: number;
  discarded: number;
  duplicateIds: string[];
  brokenParents: string[];
  brokenChildren: string[];
  logicTotal: number;
  logicValid: number;
  logicDiscarded: number;
  danglingRefsRemoved?: number;
}

export interface ValidationResult {
  objects: GameObject[];
  logicItems: LogicTextItem[];
  report: SceneImportReport;
}

export const validateSceneObject = (obj: any): obj is GameObject => {
  const hasId = typeof obj.id === 'string' && obj.id.trim() !== '';
  const hasName = typeof obj.name === 'string';
  const hasTransform = obj.transform && 
                       typeof obj.transform.x === 'number' && 
                       typeof obj.transform.y === 'number';
  
  return hasId && hasName && hasTransform;
};

export const validateLogicItem = (item: any): item is LogicTextItem => {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || item.id.trim() === '') return false;
  if (typeof item.title !== 'string') return false;
  if (typeof item.text !== 'string') return false;
  if (!Array.isArray(item.relatedObjectIds)) return false;
  if (typeof item.enabled !== 'boolean') return false;
  if (!Array.isArray(item.tags)) return false;
  if (typeof item.notes !== 'string') return false;
  return true;
};

/**
 * Extracts objects array and logicItems array from parsed JSON.
 * Supports two formats:
 * - Old format: GameObject[] (just an array)
 * - New format: { objects: GameObject[], logicItems?: LogicTextItem[] }
 */
const extractSceneData = (data: any): { objectsRaw: any[]; logicRaw: any[] } => {
  // New format: object with `objects` property
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.objects)) {
    return {
      objectsRaw: data.objects,
      logicRaw: Array.isArray(data.logicItems) ? data.logicItems : []
    };
  }
  // Old format: plain array
  if (Array.isArray(data)) {
    console.info('[Agenix Import] Legacy format detected (GameObject array). Converting to current structure.');
    return { objectsRaw: data, logicRaw: [] };
  }
  throw new Error('Scene data must be an array of objects or an object with "objects" property.');
};

export const validateAndFilterScene = (data: any): ValidationResult => {
  const { objectsRaw, logicRaw } = extractSceneData(data);

  const report: SceneImportReport = {
    total: objectsRaw.length,
    valid: 0,
    discarded: 0,
    duplicateIds: [],
    brokenParents: [],
    brokenChildren: [],
    logicTotal: logicRaw.length,
    logicValid: 0,
    logicDiscarded: 0
  };

  const idMap = new Set<string>();
  const basicValidObjects: GameObject[] = [];

  // Step 1: Basic validation and ID uniqueness for objects
  objectsRaw.forEach((obj: any) => {
    if (validateSceneObject(obj)) {
      if (idMap.has(obj.id)) {
        report.duplicateIds.push(obj.id);
        report.discarded++;
      } else {
        idMap.add(obj.id);
        basicValidObjects.push(obj);
      }
    } else {
      report.discarded++;
    }
  });

  // Step 2: Reference consistency check (does not discard, only reports)
  basicValidObjects.forEach(obj => {
    if (obj.parentId && !idMap.has(obj.parentId)) {
      report.brokenParents.push(`Object "${obj.name}" (${obj.id}) refers to missing parent "${obj.parentId}"`);
    }
    if (Array.isArray(obj.childrenIds)) {
      obj.childrenIds.forEach(childId => {
        if (!idMap.has(childId)) {
          report.brokenChildren.push(`Object "${obj.name}" (${obj.id}) refers to missing child "${childId}"`);
        }
      });
    }
  });

  if (basicValidObjects.length === 0 && objectsRaw.length > 0) {
    throw new Error('No valid objects found in the file.');
  }

  // Step 3: Validate logicItems
  const validLogicItems: LogicTextItem[] = [];
  const logicIdSet = new Set<string>();
  logicRaw.forEach((item: any) => {
    if (validateLogicItem(item)) {
      if (logicIdSet.has(item.id)) {
        report.logicDiscarded++;
      } else {
        logicIdSet.add(item.id);
        validLogicItems.push(item);
      }
    } else {
      report.logicDiscarded++;
    }
  });

  report.valid = basicValidObjects.length;
  report.logicValid = validLogicItems.length;

  // Step 4: Sanitize logicItems — remove relatedObjectIds that point to non-existent objects
  const objectIdSet = new Set(basicValidObjects.map(o => o.id));
  let danglingRefsRemoved = 0;
  const sanitizedLogicItems = validLogicItems.map(item => {
    const cleanIds = item.relatedObjectIds.filter(oid => objectIdSet.has(oid));
    const removedCount = item.relatedObjectIds.length - cleanIds.length;
    if (removedCount > 0) {
      danglingRefsRemoved += removedCount;
      return { ...item, relatedObjectIds: cleanIds };
    }
    return item;
  });

  if (danglingRefsRemoved > 0) {
    report.danglingRefsRemoved = danglingRefsRemoved;
  }

  return {
    objects: basicValidObjects,
    logicItems: sanitizedLogicItems,
    report
  };
};
