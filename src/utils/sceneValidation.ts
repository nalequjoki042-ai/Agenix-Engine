import { GameObject } from '../store/useCanvasStore';

export interface SceneImportReport {
  total: number;
  valid: number;
  discarded: number;
  duplicateIds: string[];
  brokenParents: string[];
  brokenChildren: string[];
}

export interface ValidationResult {
  objects: GameObject[];
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

export const validateAndFilterScene = (data: any): ValidationResult => {
  if (!Array.isArray(data)) {
    throw new Error('Scene data must be an array of objects.');
  }

  const report: SceneImportReport = {
    total: data.length,
    valid: 0,
    discarded: 0,
    duplicateIds: [],
    brokenParents: [],
    brokenChildren: []
  };

  const idMap = new Set<string>();
  const basicValidObjects: GameObject[] = [];

  // Step 1: Basic validation and ID uniqueness
  data.forEach((obj: any) => {
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
    // Check parentId
    if (obj.parentId && !idMap.has(obj.parentId)) {
      report.brokenParents.push(`Object "${obj.name}" (${obj.id}) refers to missing parent "${obj.parentId}"`);
    }

    // Check childrenIds
    if (Array.isArray(obj.childrenIds)) {
      obj.childrenIds.forEach(childId => {
        if (!idMap.has(childId)) {
          report.brokenChildren.push(`Object "${obj.name}" (${obj.id}) refers to missing child "${childId}"`);
        }
      });
    }
  });

  if (basicValidObjects.length === 0 && data.length > 0) {
    throw new Error('No valid objects found in the file.');
  }

  report.valid = basicValidObjects.length;

  return {
    objects: basicValidObjects,
    report
  };
};
