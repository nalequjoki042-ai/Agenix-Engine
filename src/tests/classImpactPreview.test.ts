import { describe, expect, it } from 'vitest';
import type { GameObject } from '../store/useCanvasStore';
import type { ObjectClass } from '../types/objectClass';
import { getClassImpactPreview } from '../utils/classImpactPreview';

const makeObject = (patch: Partial<GameObject> = {}): GameObject => ({
  id: 'obj-1',
  name: 'Object',
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

describe('class impact preview', () => {
  it('shows assign preview with only missing additions', () => {
    const objectClass = makeClass({
      id: 'enemy',
      name: 'Enemy',
      defaultDescription: 'Base enemy',
      defaultTags: ['enemy', 'hostile'],
      defaultProperties: { hp: 100, speed: 3 }
    });
    const object = makeObject({
      tags: ['hostile'],
      properties: { speed: 7 }
    });

    const result = getClassImpactPreview(object, 'enemy', [objectClass]);

    expect(result.mode).toBe('assign');
    expect(result.description).toBe('Base enemy');
    expect(result.tags).toEqual(['enemy']);
    expect(result.properties).toEqual([{ key: 'hp', value: 100 }]);
  });

  it('shows reapply preview for only remaining missing values', () => {
    const objectClass = makeClass({
      id: 'enemy',
      name: 'Enemy',
      defaultDescription: 'Base enemy',
      defaultTags: ['enemy', 'hostile'],
      defaultProperties: { hp: 100, speed: 3 }
    });
    const object = makeObject({
      classId: 'enemy',
      description: 'Custom desc',
      tags: ['enemy'],
      properties: { hp: 100 }
    });

    const result = getClassImpactPreview(object, 'enemy', [objectClass]);

    expect(result.mode).toBe('reapply');
    expect(result.description).toBeNull();
    expect(result.tags).toEqual(['hostile']);
    expect(result.properties).toEqual([{ key: 'speed', value: 3 }]);
  });

  it('shows nothing to add when object is already fully covered', () => {
    const objectClass = makeClass({
      id: 'enemy',
      name: 'Enemy',
      defaultDescription: 'Base enemy',
      defaultTags: ['enemy'],
      defaultProperties: { hp: 100 }
    });
    const object = makeObject({
      classId: 'enemy',
      description: 'Already local',
      tags: ['enemy'],
      properties: { hp: 100 }
    });

    const result = getClassImpactPreview(object, 'enemy', [objectClass]);

    expect(result.hasAdditions).toBe(false);
    expect(result.note).toBe('Nothing to add.');
  });

  it('includes inherited parent chain additions in preview', () => {
    const parentClass = makeClass({
      id: 'parent',
      name: 'Parent',
      defaultDescription: 'Parent desc',
      defaultTags: ['parent-tag'],
      defaultProperties: { hp: 100 }
    });
    const childClass = makeClass({
      id: 'child',
      name: 'Child',
      parentClassId: 'parent',
      defaultTags: ['child-tag'],
      defaultProperties: { speed: 3 }
    });
    const object = makeObject();

    const result = getClassImpactPreview(object, 'child', [parentClass, childClass]);

    expect(result.description).toBe('Parent desc');
    expect(result.tags).toEqual(['parent-tag', 'child-tag']);
    expect(result.properties).toEqual([
      { key: 'hp', value: 100 },
      { key: 'speed', value: 3 }
    ]);
    expect(result.inheritanceNote).toContain('parent chain');
  });

  it('does not mutate object data while computing preview', () => {
    const objectClass = makeClass({
      id: 'enemy',
      defaultDescription: 'Base enemy',
      defaultTags: ['enemy'],
      defaultProperties: { hp: 100 }
    });
    const object = makeObject();
    const snapshot = JSON.stringify(object);

    getClassImpactPreview(object, 'enemy', [objectClass]);

    expect(JSON.stringify(object)).toBe(snapshot);
  });
});
