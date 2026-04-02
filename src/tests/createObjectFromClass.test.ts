import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameObject, useCanvasStore } from '../store/useCanvasStore';
import { ObjectClass } from '../types/objectClass';

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

const makeObject = (patch: Partial<GameObject> = {}): GameObject => ({
  id: patch.id || crypto.randomUUID(),
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
  color: '#646cff',
  ...patch
});

const resetStore = () => {
  useCanvasStore.getState().setScene([], [], []);
  useCanvasStore.getState().setCamera({ x: 0, y: 0, scale: 1 });
};

describe('create object from class', () => {
  beforeEach(() => {
    resetStore();
    vi.stubGlobal('window', { innerWidth: 1200, innerHeight: 800 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates an object directly from class and auto-selects it', () => {
    const enemyClass = makeClass({
      id: 'enemy',
      name: 'Enemy',
      baseType: 'unit',
      defaultDescription: 'Enemy desc',
      defaultTags: ['enemy'],
      defaultProperties: { hp: 100 }
    });

    useCanvasStore.getState().setScene([], [], [enemyClass]);
    useCanvasStore.getState().createObjectFromClass('enemy');

    const created = useCanvasStore.getState().objects[0];
    expect(created.classId).toBe('enemy');
    expect(created.type).toBe('unit');
    expect(created.description).toBe('Enemy desc');
    expect(created.tags).toEqual(['enemy']);
    expect(created.properties).toEqual({ hp: 100 });
    expect(useCanvasStore.getState().selectedObjectIds).toEqual([created.id]);
  });

  it('uses inheritance-resolved defaults on created object', () => {
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
      baseType: 'unit',
      parentClassId: 'parent',
      defaultTags: ['child-tag'],
      defaultProperties: { speed: 3 }
    });

    useCanvasStore.getState().setScene([], [], [parentClass, childClass]);
    useCanvasStore.getState().createObjectFromClass('child');

    const created = useCanvasStore.getState().objects[0];
    expect(created.classId).toBe('child');
    expect(created.type).toBe('unit');
    expect(created.description).toBe('Parent desc');
    expect(created.tags).toEqual(['parent-tag', 'child-tag']);
    expect(created.properties).toEqual({ hp: 100, speed: 3 });
  });

  it('uses unique naming for repeated create-from-class flow', () => {
    const unitClass = makeClass({
      id: 'unit-class',
      name: 'Unit',
      baseType: 'unit'
    });

    useCanvasStore.getState().setScene([], [], [unitClass]);
    useCanvasStore.getState().createObjectFromClass('unit-class');
    useCanvasStore.getState().createObjectFromClass('unit-class');
    useCanvasStore.getState().createObjectFromClass('unit-class');

    expect(useCanvasStore.getState().objects.map(object => object.name)).toEqual(['Unit', 'Unit 2', 'Unit 3']);
  });

  it('falls back to type-based naming when class name is empty', () => {
    const blankClass = makeClass({
      id: 'blank-name',
      name: '   ',
      baseType: 'unit'
    });

    useCanvasStore.getState().setScene([], [], [blankClass]);
    useCanvasStore.getState().createObjectFromClass('blank-name');

    expect(useCanvasStore.getState().objects[0].name).toBe('Unit');
  });

  it('falls back to box on invalid baseType and warns once', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const brokenClass = makeClass({
      id: 'broken-type',
      name: 'Broken',
      baseType: 'box'
    }) as ObjectClass;

    (brokenClass as unknown as { baseType: string }).baseType = 'ghost';

    useCanvasStore.getState().setScene([], [], [brokenClass]);
    useCanvasStore.getState().createObjectFromClass('broken-type');

    const created = useCanvasStore.getState().objects[0];
    expect(created.type).toBe('box');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain('Invalid baseType');
    warnSpy.mockRestore();
  });

  it('falls back to safe spawn position when camera center fails', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const enemyClass = makeClass({
      id: 'enemy',
      name: 'Enemy'
    });

    useCanvasStore.getState().setScene([], [], [enemyClass]);
    useCanvasStore.getState().setCamera({ x: 0, y: 0, scale: 0 });
    useCanvasStore.getState().createObjectFromClass('enemy');

    const created = useCanvasStore.getState().objects[0];
    expect(created.transform.x).toBe(0);
    expect(created.transform.y).toBe(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain('camera-center spawn position');
    warnSpy.mockRestore();
  });

  it('missing class is safe no-op and warns once', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    useCanvasStore.getState().setScene([], [], []);
    useCanvasStore.getState().createObjectFromClass('missing-class');

    expect(useCanvasStore.getState().objects).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain('class "missing-class" not found');
    warnSpy.mockRestore();
  });

  it('camera center spawn uses current camera state when valid', () => {
    const enemyClass = makeClass({
      id: 'enemy',
      name: 'Enemy'
    });

    useCanvasStore.getState().setScene([], [], [enemyClass]);
    useCanvasStore.getState().setCamera({ x: 100, y: 50, scale: 2 });
    useCanvasStore.getState().createObjectFromClass('enemy');

    const created = useCanvasStore.getState().objects[0];
    expect(created.transform.x).toBe(250);
    expect(created.transform.y).toBe(175);
  });

  it('shared bootstrap keeps normal object defaults aligned with create-from-class', () => {
    const existing = [
      makeObject({ name: 'Box' })
    ];
    const classBox = makeClass({
      id: 'class-box',
      name: 'Box',
      baseType: 'box'
    });

    useCanvasStore.getState().setScene(existing, [], [classBox]);
    useCanvasStore.getState().createObjectFromClass('class-box');
    const created = useCanvasStore.getState().objects[1];

    expect(created.name).toBe('Box 2');
    expect(created.width).toBe(100);
    expect(created.height).toBe(100);
    expect(created.color).toBe('#646cff');
  });
});
