import { describe, expect, it } from 'vitest';
import type { GameObject } from '../store/useCanvasStore';
import type { ObjectClass } from '../types/objectClass';
import { getClassSourceHints } from '../utils/classSourceHints';

const makeObject = (patch: Partial<GameObject> = {}): GameObject => ({
  id: 'obj-1',
  name: 'Obj',
  type: 'box',
  classId: null,
  parentId: null,
  childrenIds: [],
  tags: [],
  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  properties: {},
  logicRefs: [],
  description: '',
  width: 100,
  height: 100,
  color: '#fff',
  ...patch
});

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

describe('class source hints (heuristic, non-provenance)', () => {
  it('detached object falls back to local / other', () => {
    const result = getClassSourceHints(makeObject({ classId: null }), []);
    expect(result.summary.state).toBe('Detached');
    expect(result.hints.description).toBe('local / other');
    expect(result.hints.tags).toBe('local / other');
    expect(result.hints.properties).toBe('local / other');
  });

  it('detects direct class default matches', () => {
    const objectClass = makeClass({
      id: 'class-a',
      defaultDescription: 'Class desc',
      defaultTags: ['enemy'],
      defaultProperties: { hp: 100 }
    });
    const object = makeObject({
      classId: 'class-a',
      description: 'Class desc',
      tags: ['enemy'],
      properties: { hp: 100 }
    });

    const result = getClassSourceHints(object, [objectClass]);
    expect(result.summary.state).toBe('Assigned');
    expect(result.hints.description).toBe('matches class defaults');
    expect(result.hints.tags).toBe('matches class defaults');
    expect(result.hints.properties).toBe('matches class defaults');
  });

  it('detects inherited-only matches', () => {
    const parentClass = makeClass({
      id: 'parent',
      name: 'Parent',
      defaultDescription: 'Parent desc',
      defaultTags: ['parent-tag'],
      defaultProperties: { hp: 120 }
    });
    const childClass = makeClass({
      id: 'child',
      name: 'Child',
      parentClassId: 'parent',
      defaultDescription: '',
      defaultTags: [],
      defaultProperties: {}
    });
    const object = makeObject({
      classId: 'child',
      description: 'Parent desc',
      tags: ['parent-tag'],
      properties: { hp: 120 }
    });

    const result = getClassSourceHints(object, [parentClass, childClass]);
    expect(result.summary.state).toBe('Assigned + Inherited');
    expect(result.hints.description).toBe('matches inherited defaults');
    expect(result.hints.tags).toBe('matches inherited defaults');
    expect(result.hints.properties).toBe('matches inherited defaults');
  });

  it('returns mixed only for true mixed matching', () => {
    const parentClass = makeClass({
      id: 'parent',
      defaultTags: ['parent-tag'],
      defaultProperties: { hp: 100 }
    });
    const childClass = makeClass({
      id: 'child',
      parentClassId: 'parent',
      defaultTags: ['child-tag'],
      defaultProperties: { speed: 3 }
    });
    const object = makeObject({
      classId: 'child',
      description: 'manual',
      tags: ['parent-tag', 'child-tag', 'manual-tag'],
      properties: { hp: 100, speed: 3, custom: true }
    });

    const result = getClassSourceHints(object, [parentClass, childClass]);
    expect(result.hints.description).toBe('differs from class defaults');
    expect(result.hints.tags).toBe('mixed');
    expect(result.hints.properties).toBe('mixed');
  });

  it('identifies values differing from class defaults', () => {
    const objectClass = makeClass({
      id: 'class-a',
      defaultDescription: 'Class desc',
      defaultTags: ['enemy'],
      defaultProperties: { hp: 100 }
    });
    const object = makeObject({
      classId: 'class-a',
      description: 'Other desc',
      tags: ['neutral'],
      properties: { speed: 10 }
    });

    const result = getClassSourceHints(object, [objectClass]);
    expect(result.hints.description).toBe('differs from class defaults');
    expect(result.hints.tags).toBe('differs from class defaults');
    expect(result.hints.properties).toBe('differs from class defaults');
  });

  it('handles broken class link with safe local / other fallback', () => {
    const object = makeObject({
      classId: 'missing-class',
      description: 'Unknown',
      tags: ['x'],
      properties: { a: 1 }
    });

    const result = getClassSourceHints(object, []);
    expect(result.summary.state).toBe('Broken Link');
    expect(result.hints.description).toBe('local / other');
    expect(result.hints.tags).toBe('local / other');
    expect(result.hints.properties).toBe('local / other');
  });

  it('manual value that equals class default remains match-based, not provenance claim', () => {
    const objectClass = makeClass({
      id: 'class-a',
      defaultDescription: 'same',
      defaultTags: ['same-tag'],
      defaultProperties: { hp: 50 }
    });
    const object = makeObject({
      classId: 'class-a',
      description: 'same',
      tags: ['same-tag'],
      properties: { hp: 50 }
    });

    const result = getClassSourceHints(object, [objectClass]);
    expect(result.hints.description).toBe('matches class defaults');
    expect(result.hints.tags).toBe('matches class defaults');
    expect(result.hints.properties).toBe('matches class defaults');
    expect(result.disclaimer).toContain('matches');
    expect(result.disclaimer.toLowerCase()).not.toContain('from class');
  });
});
