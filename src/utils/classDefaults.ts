import type { GameObject } from '../store/useCanvasStore';
import type { ObjectClass } from '../types/objectClass';

export type ResolvedClassDefaults = {
  targetClass: ObjectClass;
  chain: ObjectClass[];
  parentClass: ObjectClass | null;
  defaultDescription: string;
  defaultTags: string[];
  defaultProperties: Record<string, unknown>;
  baseType: 'box' | 'zone' | 'unit' | 'custom';
};

export type MissingClassAdditions = {
  description: string | null;
  tags: string[];
  properties: Record<string, unknown>;
  hasAdditions: boolean;
};

export const resolveInheritedClassDefaults = (
  classId: string,
  objectClasses: ObjectClass[]
): ResolvedClassDefaults | null => {
  const visited = new Set<string>();
  let currentClassId: string | null = classId;
  const chain: ObjectClass[] = [];

  while (currentClassId) {
    if (visited.has(currentClassId)) {
      console.warn(`[Agenix Inheritance] Cyclic inheritance detected at class ${currentClassId}. Breaking loop.`);
      break;
    }

    visited.add(currentClassId);
    const currentClass = objectClasses.find(objectClass => objectClass.id === currentClassId);
    if (!currentClass) break;

    chain.push(currentClass);
    currentClassId = currentClass.parentClassId;
  }

  if (chain.length === 0) return null;

  chain.reverse();

  let resolvedDescription = '';
  let resolvedTags: string[] = [];
  const resolvedProperties: Record<string, unknown> = {};
  let resolvedBaseType: 'box' | 'zone' | 'unit' | 'custom' = 'box';

  chain.forEach(currentClass => {
    if (currentClass.defaultDescription && currentClass.defaultDescription.trim() !== '') {
      resolvedDescription = currentClass.defaultDescription;
    }

    if (currentClass.defaultTags && currentClass.defaultTags.length > 0) {
      resolvedTags = [...new Set([...resolvedTags, ...currentClass.defaultTags])];
    }

    if (currentClass.defaultProperties) {
      Object.assign(resolvedProperties, currentClass.defaultProperties);
    }

    if (currentClass.baseType) {
      resolvedBaseType = currentClass.baseType;
    }
  });

  const targetClass = chain[chain.length - 1];
  const parentClass = targetClass.parentClassId
    ? objectClasses.find(objectClass => objectClass.id === targetClass.parentClassId) || null
    : null;

  return {
    targetClass,
    chain,
    parentClass,
    defaultDescription: resolvedDescription,
    defaultTags: resolvedTags,
    defaultProperties: resolvedProperties,
    baseType: resolvedBaseType
  };
};

export const getMissingClassAdditions = (
  gameObject: GameObject,
  resolvedClass: ResolvedClassDefaults
): MissingClassAdditions => {
  const description = gameObject.description && gameObject.description.trim() !== ''
    ? null
    : (resolvedClass.defaultDescription || null);

  const existingTags = new Set(gameObject.tags || []);
  const tags = (resolvedClass.defaultTags || []).filter(tag => !existingTags.has(tag));

  const properties: Record<string, unknown> = {};
  Object.entries(resolvedClass.defaultProperties || {}).forEach(([key, value]) => {
    if (!(key in (gameObject.properties || {}))) {
      properties[key] = value;
    }
  });

  return {
    description,
    tags,
    properties,
    hasAdditions: Boolean(description) || tags.length > 0 || Object.keys(properties).length > 0
  };
};

export const applyMissingResolvedClassDefaults = (
  gameObject: GameObject,
  resolvedClass: ResolvedClassDefaults,
  nextClassId?: string | null
): GameObject => {
  const additions = getMissingClassAdditions(gameObject, resolvedClass);

  return {
    ...gameObject,
    classId: nextClassId !== undefined ? nextClassId : gameObject.classId,
    description: additions.description ?? gameObject.description,
    tags: [...new Set([...(gameObject.tags || []), ...additions.tags])],
    properties: {
      ...(gameObject.properties || {}),
      ...additions.properties
    }
  };
};
