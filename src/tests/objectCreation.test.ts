import { describe, expect, it } from 'vitest';
import type { GameObject } from '../store/useCanvasStore';
import {
  createBaseObjectByType,
  getCameraCenterSpawnPosition,
  getUniqueObjectName
} from '../utils/objectCreation';

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

describe('object creation helpers', () => {
  it('creates normal box bootstrap with existing defaults', () => {
    const created = createBaseObjectByType({
      type: 'box',
      position: { x: 10, y: 20 },
      existingObjects: []
    });

    expect(created.type).toBe('box');
    expect(created.name).toBe('Box');
    expect(created.width).toBe(100);
    expect(created.height).toBe(100);
    expect(created.color).toBe('#646cff');
    expect(created.transform.x).toBe(10);
    expect(created.transform.y).toBe(20);
  });

  it('creates normal zone bootstrap with existing defaults', () => {
    const created = createBaseObjectByType({
      type: 'zone',
      position: { x: 5, y: 6 },
      existingObjects: []
    });

    expect(created.type).toBe('zone');
    expect(created.name).toBe('Zone');
    expect(created.width).toBe(100);
    expect(created.height).toBe(100);
    expect(created.color).toBe('rgba(255, 100, 100, 0.5)');
  });

  it('reuses naming helper for normal object creation', () => {
    const existing = [
      makeObject({ name: 'Box' }),
      makeObject({ name: 'Box 2' })
    ];

    const created = createBaseObjectByType({
      type: 'box',
      position: { x: 0, y: 0 },
      existingObjects: existing
    });

    expect(created.name).toBe('Box 3');
  });

  it('falls back from empty preferred name to type-based name', () => {
    const existing = [
      makeObject({ name: 'Unit' })
    ];

    expect(getUniqueObjectName(existing, 'unit', '   ')).toBe('Unit 2');
  });

  it('uses preferred name with incrementing suffixes', () => {
    const existing = [
      makeObject({ name: 'Enemy' }),
      makeObject({ name: 'Enemy 2' })
    ];

    expect(getUniqueObjectName(existing, 'unit', 'Enemy')).toBe('Enemy 3');
  });

  it('falls back safely when camera center cannot be resolved', () => {
    const result = getCameraCenterSpawnPosition(
      { x: 0, y: 0, scale: 0 },
      { width: 1280, height: 720 }
    );

    expect(result.usedFallback).toBe(true);
    expect(result.position).toEqual({ x: 0, y: 0 });
  });

  it('computes world position from camera center when available', () => {
    const result = getCameraCenterSpawnPosition(
      { x: 100, y: 50, scale: 2 },
      { width: 1200, height: 800 }
    );

    expect(result.usedFallback).toBe(false);
    expect(result.position).toEqual({ x: 250, y: 175 });
  });
});
