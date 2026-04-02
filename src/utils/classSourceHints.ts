import type { GameObject } from '../store/useCanvasStore';
import type { ObjectClass } from '../types/objectClass';

export type ClassHint =
  | 'matches class defaults'
  | 'matches inherited defaults'
  | 'mixed'
  | 'differs from class defaults'
  | 'local / other';

export type ClassSummaryState =
  | 'Detached'
  | 'Assigned'
  | 'Assigned + Inherited'
  | 'Broken Link';

export type ClassSummary = {
  assignedClassName: string;
  parentClassName: string;
  state: ClassSummaryState;
  note: string;
};

export type ClassSourceHintsResult = {
  summary: ClassSummary;
  hints: {
    description: ClassHint;
    tags: ClassHint;
    properties: ClassHint;
  };
  disclaimer: string;
};

type ClassDefaultsBreakdown = {
  directClass: ObjectClass;
  parentClass: ObjectClass | null;
  directDescription: string;
  inheritedDescription: string;
  directTags: Set<string>;
  inheritedTags: Set<string>;
  directProperties: Record<string, unknown>;
  inheritedProperties: Record<string, unknown>;
};

const HINT_LOCAL: ClassHint = 'local / other';

const normalizeTags = (tags: string[]): string[] =>
  [...new Set(tags.map(tag => tag.trim()).filter(Boolean))];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i += 1) {
      if (!deepEqual(left[i], right[i])) return false;
    }
    return true;
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    for (const key of leftKeys) {
      if (!rightKeys.includes(key)) return false;
      if (!deepEqual(left[key], right[key])) return false;
    }
    return true;
  }

  return false;
};

const resolveClassChain = (classId: string, objectClasses: ObjectClass[]): ObjectClass[] => {
  const visited = new Set<string>();
  const chain: ObjectClass[] = [];
  let currentClassId: string | null = classId;

  while (currentClassId) {
    if (visited.has(currentClassId)) break;
    visited.add(currentClassId);

    const currentClass = objectClasses.find(cls => cls.id === currentClassId);
    if (!currentClass) break;

    chain.push(currentClass);
    currentClassId = currentClass.parentClassId;
  }

  return chain.reverse();
};

const buildDefaultsBreakdown = (
  classId: string | null,
  objectClasses: ObjectClass[]
): ClassDefaultsBreakdown | null => {
  if (!classId) return null;

  const chain = resolveClassChain(classId, objectClasses);
  if (chain.length === 0) return null;

  const directClass = chain[chain.length - 1];
  const parentClasses = chain.slice(0, -1);

  let inheritedDescription = '';
  const inheritedTags = new Set<string>();
  const inheritedProperties: Record<string, unknown> = {};

  parentClasses.forEach(parent => {
    const parentDescription = parent.defaultDescription.trim();
    if (parentDescription) inheritedDescription = parentDescription;
    normalizeTags(parent.defaultTags).forEach(tag => inheritedTags.add(tag));
    Object.entries(parent.defaultProperties).forEach(([key, value]) => {
      inheritedProperties[key] = value;
    });
  });

  const directDescription = directClass.defaultDescription.trim();
  const directTags = new Set<string>(normalizeTags(directClass.defaultTags));
  const directProperties = { ...directClass.defaultProperties };

  Object.keys(directProperties).forEach(key => {
    delete inheritedProperties[key];
  });

  const parentClass =
    directClass.parentClassId
      ? objectClasses.find(cls => cls.id === directClass.parentClassId) || null
      : null;

  return {
    directClass,
    parentClass,
    directDescription,
    inheritedDescription,
    directTags,
    inheritedTags,
    directProperties,
    inheritedProperties
  };
};

const classifyDescriptionHint = (
  objectValue: string | undefined,
  defaults: ClassDefaultsBreakdown | null
): ClassHint => {
  if (!defaults) return HINT_LOCAL;

  const value = (objectValue || '').trim();
  
  if (value === defaults.directDescription) return 'matches class defaults';
  if (defaults.inheritedDescription !== '' && value === defaults.inheritedDescription) return 'matches inherited defaults';
  
  return 'differs from class defaults';
};

const classifyTagsHint = (
  objectTags: string[],
  defaults: ClassDefaultsBreakdown | null
): ClassHint => {
  if (!defaults) return HINT_LOCAL;

  const tags = normalizeTags(objectTags);

  const exactDirectMatch = tags.length === defaults.directTags.size && 
    tags.every(t => defaults.directTags.has(t));
    
  if (exactDirectMatch) return 'matches class defaults';

  const exactInheritedMatch = defaults.inheritedTags.size > 0 && tags.length === defaults.inheritedTags.size && 
    tags.every(t => defaults.inheritedTags.has(t));

  if (exactInheritedMatch) return 'matches inherited defaults';

  let hasAnyMatch = false;
  tags.forEach(t => {
    if (defaults.directTags.has(t) || defaults.inheritedTags.has(t)) {
      hasAnyMatch = true;
    }
  });

  if (hasAnyMatch) return 'mixed';

  return 'differs from class defaults';
};

const classifyPropertiesHint = (
  objectProperties: Record<string, unknown>,
  defaults: ClassDefaultsBreakdown | null
): ClassHint => {
  if (!defaults) return HINT_LOCAL;

  const entries = Object.entries(objectProperties);
  const directEntries = Object.entries(defaults.directProperties);
  const inheritedEntries = Object.entries(defaults.inheritedProperties);

  const exactDirectMatch = entries.length === directEntries.length &&
    entries.every(([k, v]) => k in defaults.directProperties && deepEqual(v, defaults.directProperties[k]));

  if (exactDirectMatch) return 'matches class defaults';

  const exactInheritedMatch = inheritedEntries.length > 0 && entries.length === inheritedEntries.length &&
    entries.every(([k, v]) => k in defaults.inheritedProperties && deepEqual(v, defaults.inheritedProperties[k]));

  if (exactInheritedMatch) return 'matches inherited defaults';

  let hasAnyMatch = false;
  entries.forEach(([k, v]) => {
    if (k in defaults.directProperties && deepEqual(v, defaults.directProperties[k])) {
      hasAnyMatch = true;
    }
    if (k in defaults.inheritedProperties && deepEqual(v, defaults.inheritedProperties[k])) {
      hasAnyMatch = true;
    }
  });

  if (hasAnyMatch) return 'mixed';

  return 'differs from class defaults';
};

const buildSummary = (
  gameObject: GameObject,
  defaults: ClassDefaultsBreakdown | null
): ClassSummary => {
  if (!gameObject.classId) {
    return {
      assignedClassName: 'None',
      parentClassName: 'None',
      state: 'Detached',
      note: 'No class link. Object values are local.'
    };
  }

  if (!defaults) {
    return {
      assignedClassName: `Missing (${gameObject.classId})`,
      parentClassName: 'None',
      state: 'Broken Link',
      note: 'Class link exists but class data is missing.'
    };
  }

  const hasParent = Boolean(defaults.directClass.parentClassId);
  const parentName = defaults.parentClass
    ? defaults.parentClass.name
    : hasParent
      ? `Missing (${defaults.directClass.parentClassId})`
      : 'None';

  if (hasParent && defaults.parentClass) {
    return {
      assignedClassName: defaults.directClass.name,
      parentClassName: parentName,
      state: 'Assigned + Inherited',
      note: 'Class and parent defaults can match current values.'
    };
  }

  return {
    assignedClassName: defaults.directClass.name,
    parentClassName: parentName,
    state: 'Assigned',
    note: 'Class defaults can match current values.'
  };
};

export const getClassSourceHints = (
  gameObject: GameObject,
  objectClasses: ObjectClass[]
): ClassSourceHintsResult => {
  const defaults = buildDefaultsBreakdown(gameObject.classId, objectClasses);

  return {
    summary: buildSummary(gameObject, defaults),
    hints: {
      description: classifyDescriptionHint(gameObject.description, defaults),
      tags: classifyTagsHint(gameObject.tags || [], defaults),
      properties: classifyPropertiesHint(gameObject.properties || {}, defaults)
    },
    disclaimer: 'Hints show value matches, not data origin.'
  };
};