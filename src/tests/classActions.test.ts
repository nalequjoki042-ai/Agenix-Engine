import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameObject, useCanvasStore } from '../store/useCanvasStore';
import { ObjectClass } from '../types/objectClass';

const createObject = (patch: Partial<GameObject> = {}): GameObject => ({
  id: 'obj-1',
  name: 'Object 1',
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
  color: '#ffffff',
  ...patch
});

const createClass = (patch: Partial<ObjectClass> = {}): ObjectClass => ({
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

const resetStore = () => {
  useCanvasStore.getState().setScene([], [], []);
};

describe('Class Detach / Reapply Controls', () => {
  beforeEach(() => {
    resetStore();
  });

  it('detach clears only classId', () => {
    const cls = createClass({
      id: 'class-detach',
      defaultDescription: 'Class description',
      defaultTags: ['class-tag'],
      defaultProperties: { hp: 100 }
    });
    const obj = createObject({ id: 'obj-detach' });

    useCanvasStore.getState().setScene([obj], [], [cls]);
    useCanvasStore.getState().assignClassToObject('obj-detach', 'class-detach');

    const assignedObject = useCanvasStore.getState().objects.find(o => o.id === 'obj-detach');
    expect(assignedObject?.classId).toBe('class-detach');

    useCanvasStore.getState().unassignClassFromObject('obj-detach');
    const detachedObject = useCanvasStore.getState().objects.find(o => o.id === 'obj-detach');

    expect(detachedObject?.classId).toBeNull();
    expect(detachedObject?.description).toBe(assignedObject?.description);
    expect(detachedObject?.tags).toEqual(assignedObject?.tags);
    expect(detachedObject?.properties).toEqual(assignedObject?.properties);
  });

  it('detach does not remove description/tags/properties', () => {
    const obj = createObject({
      id: 'obj-safe-detach',
      classId: 'class-safe-detach',
      description: 'Keep me',
      tags: ['custom'],
      properties: { hp: 999, role: 'boss' }
    });

    useCanvasStore.getState().setScene([obj], [], []);
    useCanvasStore.getState().unassignClassFromObject('obj-safe-detach');
    const detachedObject = useCanvasStore.getState().objects.find(o => o.id === 'obj-safe-detach');

    expect(detachedObject?.classId).toBeNull();
    expect(detachedObject?.description).toBe('Keep me');
    expect(detachedObject?.tags).toEqual(['custom']);
    expect(detachedObject?.properties).toEqual({ hp: 999, role: 'boss' });
  });

  it('reapply restores only missing fields', () => {
    const cls = createClass({
      id: 'class-missing',
      defaultDescription: 'Default desc',
      defaultTags: ['enemy', 'melee'],
      defaultProperties: { hp: 100, speed: 10 }
    });
    const obj = createObject({
      id: 'obj-missing',
      classId: 'class-missing',
      description: '',
      tags: ['enemy'],
      properties: { hp: 100 }
    });

    useCanvasStore.getState().setScene([obj], [], [cls]);
    useCanvasStore.getState().reapplyMissingClassDefaults('obj-missing');
    const reapplied = useCanvasStore.getState().objects.find(o => o.id === 'obj-missing');

    expect(reapplied?.description).toBe('Default desc');
    expect(reapplied?.tags).toEqual(['enemy', 'melee']);
    expect(reapplied?.properties).toEqual({ hp: 100, speed: 10 });
  });

  it('reapply does not overwrite custom values', () => {
    const cls = createClass({
      id: 'class-no-overwrite',
      defaultDescription: 'Class desc',
      defaultTags: ['enemy', 'custom'],
      defaultProperties: { hp: 100, speed: 3 }
    });
    const obj = createObject({
      id: 'obj-no-overwrite',
      classId: 'class-no-overwrite',
      description: 'Custom desc',
      tags: ['custom'],
      properties: { hp: 999 }
    });

    useCanvasStore.getState().setScene([obj], [], [cls]);
    useCanvasStore.getState().reapplyMissingClassDefaults('obj-no-overwrite');
    const reapplied = useCanvasStore.getState().objects.find(o => o.id === 'obj-no-overwrite');

    expect(reapplied?.description).toBe('Custom desc');
    expect(reapplied?.tags).toEqual(['custom', 'enemy']);
    expect(reapplied?.properties).toEqual({ hp: 999, speed: 3 });
  });

  it('reapply resolves inheritance safely', () => {
    const parentClass = createClass({
      id: 'parent-class',
      defaultDescription: 'Parent desc',
      defaultTags: ['parent-tag'],
      defaultProperties: { hp: 100, armor: 10 }
    });
    const childClass = createClass({
      id: 'child-class',
      parentClassId: 'parent-class',
      defaultDescription: 'Child desc',
      defaultTags: ['child-tag'],
      defaultProperties: { armor: 20, mana: 50 }
    });
    const obj = createObject({
      id: 'obj-inherited',
      classId: 'child-class',
      description: '',
      tags: [],
      properties: {}
    });

    useCanvasStore.getState().setScene([obj], [], [parentClass, childClass]);
    useCanvasStore.getState().reapplyMissingClassDefaults('obj-inherited');
    const reapplied = useCanvasStore.getState().objects.find(o => o.id === 'obj-inherited');

    expect(reapplied?.description).toBe('Child desc');
    expect(reapplied?.tags).toEqual(['parent-tag', 'child-tag']);
    expect(reapplied?.properties).toEqual({ hp: 100, armor: 20, mana: 50 });
  });

  it('reapply with classId = null is safe no-op', () => {
    const obj = createObject({
      id: 'obj-no-class',
      classId: null,
      description: 'No class',
      tags: ['keep'],
      properties: { hp: 50 }
    });

    useCanvasStore.getState().setScene([obj], [], []);
    const before = JSON.parse(JSON.stringify(useCanvasStore.getState().objects[0]));

    useCanvasStore.getState().reapplyMissingClassDefaults('obj-no-class');
    const after = useCanvasStore.getState().objects[0];

    expect(after).toEqual(before);
  });

  it('reapply with missing class is safe no-op and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const obj = createObject({
      id: 'obj-missing-class',
      classId: 'ghost-class',
      description: 'Keep desc',
      tags: ['keep'],
      properties: { hp: 42 }
    });

    useCanvasStore.getState().setScene([obj], [], []);
    const before = JSON.parse(JSON.stringify(useCanvasStore.getState().objects[0]));

    useCanvasStore.getState().reapplyMissingClassDefaults('obj-missing-class');
    const after = useCanvasStore.getState().objects[0];

    expect(after).toEqual(before);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('Cannot reapply defaults');
    warnSpy.mockRestore();
  });
});
