import { describe, expect, it } from 'vitest';
import type { ObjectClass } from '../types/objectClass';
import {
  BROKEN_PARENT_OPTION_VALUE,
  getClassParentUiState,
  getInvalidParentSelectionReason
} from '../utils/classParentUi';

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

describe('class parent ui state', () => {
  it('shows assigned parent clearly for a normal link', () => {
    const parentClass = makeClass({ id: 'parent', name: 'Parent' });
    const childClass = makeClass({ id: 'child', name: 'Child', parentClassId: 'parent' });

    const result = getClassParentUiState(childClass, [parentClass, childClass]);

    expect(result.currentParentName).toBe('Parent');
    expect(result.linkState).toBe('Assigned');
    expect(result.selectorValue).toBe('parent');
    expect(result.note).toContain('inherits missing defaults');
  });

  it('marks self-parent choices as blocked', () => {
    const objectClass = makeClass({ id: 'self', name: 'Self' });

    const result = getClassParentUiState(objectClass, [objectClass]);

    expect(getInvalidParentSelectionReason('self', 'self', [objectClass])).toBe('self');
    expect(result.options[0]).toMatchObject({
      id: 'self',
      status: 'self',
      label: 'Self (self blocked)'
    });
  });

  it('marks cycle-causing choices as blocked', () => {
    const rootClass = makeClass({ id: 'root', name: 'Root' });
    const middleClass = makeClass({ id: 'middle', name: 'Middle', parentClassId: 'root' });
    const leafClass = makeClass({ id: 'leaf', name: 'Leaf', parentClassId: 'middle' });

    const result = getClassParentUiState(rootClass, [rootClass, middleClass, leafClass]);

    expect(getInvalidParentSelectionReason('root', 'leaf', [rootClass, middleClass, leafClass])).toBe('cycle');
    expect(result.options.find(option => option.id === 'leaf')).toMatchObject({
      status: 'cycle',
      label: 'Leaf (cycle blocked)'
    });
  });

  it('shows broken parent link safely', () => {
    const childClass = makeClass({ id: 'child', name: 'Child', parentClassId: 'missing-parent' });

    const result = getClassParentUiState(childClass, [childClass]);

    expect(result.linkState).toBe('Broken Link');
    expect(result.currentParentName).toBe('Missing (missing-parent)');
    expect(result.selectorValue).toBe(BROKEN_PARENT_OPTION_VALUE);
    expect(result.brokenParentId).toBe('missing-parent');
  });

  it('shows none state when no parent is assigned', () => {
    const objectClass = makeClass({ id: 'solo', name: 'Solo', parentClassId: null });

    const result = getClassParentUiState(objectClass, [objectClass]);

    expect(result.linkState).toBe('None');
    expect(result.currentParentName).toBe('None');
    expect(result.selectorValue).toBe('');
  });
});
