import type { GameObject } from '../store/useCanvasStore';
import type { ObjectClass } from '../types/objectClass';
import { getMissingClassAdditions, resolveInheritedClassDefaults } from './classDefaults';

export type ClassImpactPreviewMode = 'none' | 'assign' | 'reapply' | 'unavailable';

export type ClassImpactPreview = {
  mode: ClassImpactPreviewMode;
  targetClassName: string;
  parentClassName: string;
  note: string;
  inheritanceNote: string;
  description: string | null;
  tags: string[];
  properties: Array<{ key: string; value: unknown }>;
  hasAdditions: boolean;
};

export const getClassImpactPreview = (
  gameObject: GameObject,
  targetClassId: string | null,
  objectClasses: ObjectClass[]
): ClassImpactPreview => {
  if (!targetClassId) {
    return {
      mode: 'none',
      targetClassName: 'None',
      parentClassName: 'None',
      note: 'Select a class to preview missing additions.',
      inheritanceNote: '',
      description: null,
      tags: [],
      properties: [],
      hasAdditions: false
    };
  }

  const resolvedClass = resolveInheritedClassDefaults(targetClassId, objectClasses);
  if (!resolvedClass) {
    return {
      mode: 'unavailable',
      targetClassName: `Missing (${targetClassId})`,
      parentClassName: 'None',
      note: 'Class defaults are unavailable for preview.',
      inheritanceNote: '',
      description: null,
      tags: [],
      properties: [],
      hasAdditions: false
    };
  }

  const additions = getMissingClassAdditions(gameObject, resolvedClass);
  const mode: ClassImpactPreviewMode = gameObject.classId === targetClassId ? 'reapply' : 'assign';
  const parentClassName = resolvedClass.parentClass?.name || 'None';
  const includesInheritance = resolvedClass.chain.length > 1;

  return {
    mode,
    targetClassName: resolvedClass.targetClass.name,
    parentClassName,
    note: additions.hasAdditions
      ? 'Preview only. Object data stays unchanged until you apply.'
      : 'Nothing to add.',
    inheritanceNote: includesInheritance
      ? 'Includes resolved defaults from the parent chain.'
      : 'Uses this class defaults only.',
    description: additions.description,
    tags: additions.tags,
    properties: Object.entries(additions.properties).map(([key, value]) => ({ key, value })),
    hasAdditions: additions.hasAdditions
  };
};
