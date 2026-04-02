import { describe, expect, it } from 'vitest';
import type { ObjectClass } from '../types/objectClass';
import { getClassCreationSummary } from '../utils/classDefaults';

const makeClass = (patch: Partial<ObjectClass> = {}): ObjectClass => ({
  id: 'class-1',
  name: 'Class 1',
  description: '',
  baseType: 'box',
  defaultTags: [],
  defaultProperties: {},
  defaultDescription: '',
  parentClassId: null,
  ...patch
});

describe('getClassCreationSummary', () => {
  it('handles class without parent and without defaults (compact fallback)', () => {
    const objectClass = makeClass({
      id: 'simple-class'
    });

    const result = getClassCreationSummary('simple-class', [objectClass]);

    expect(result).not.toBeNull();
    expect(result?.resultingType).toBe('box');
    expect(result?.parentInvolved).toBe(false);
    expect(result?.hasDescription).toBe(false);
    expect(result?.tagsCount).toBe(0);
    expect(result?.propertiesCount).toBe(0);
  });

  it('handles class with parent chain and correctly counts defaults', () => {
    const parentClass = makeClass({
      id: 'parent-class',
      defaultDescription: 'Parent description',
      defaultTags: ['parent-tag'],
      defaultProperties: { parentProp: 1 }
    });

    const childClass = makeClass({
      id: 'child-class',
      parentClassId: 'parent-class',
      defaultTags: ['child-tag'],
      defaultProperties: { childProp: 2 }
    });

    // We pass both classes so the chain resolves
    const result = getClassCreationSummary('child-class', [parentClass, childClass]);

    expect(result).not.toBeNull();
    // Default baseType is 'box' if not explicitly changed
    expect(result?.resultingType).toBe('box');
    // Chain length > 1, so parent calculation is involved
    expect(result?.parentInvolved).toBe(true);
    // Description inherited from parent
    expect(result?.hasDescription).toBe(true);
    // 2 tags merged (parent-tag, child-tag)
    expect(result?.tagsCount).toBe(2);
    // 2 properties merged (parentProp, childProp)
    expect(result?.propertiesCount).toBe(2);
  });

  it('handles fallback resultingType if explicitly missing and broken in some way', () => {
    // In TS baseType must be one of 'box' | 'zone' | etc, but we cast to check fallback logic from classDefaults
    const brokenClass = makeClass({
      id: 'broken',
      baseType: undefined as any
    });

    const result = getClassCreationSummary('broken', [brokenClass]);

    expect(result).not.toBeNull();
    expect(result?.resultingType).toBe('box'); // Fallback works
  });
});
