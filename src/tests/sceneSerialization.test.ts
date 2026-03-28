import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore, GameObject } from '../store/useCanvasStore';
import { validateAndFilterScene } from '../utils/sceneValidation';

const resetStore = () => {
  const { setObjects, selectObject } = useCanvasStore.getState();
  setObjects([]);
  selectObject(null);
};

describe('Scene Serialization & Validation', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('Validation Logic', () => {
    it('should throw error if data is not an array', () => {
      expect(() => validateAndFilterScene({})).toThrow('Scene data must be an array of objects.');
    });

    it('should filter out objects missing mandatory fields', () => {
      const mixedData = [
        { id: 'valid-1', name: 'Valid', transform: { x: 0, y: 0 } },
        { id: 'invalid-no-name', transform: { x: 0, y: 0 } },
      ];
      
      const { objects, report } = validateAndFilterScene(mixedData);
      expect(objects).toHaveLength(1);
      expect(report.discarded).toBe(1);
    });

    it('should filter out duplicate IDs', () => {
      const dataWithDuplicates = [
        { id: 'dup', name: 'Original', transform: { x: 0, y: 0 } },
        { id: 'dup', name: 'Duplicate', transform: { x: 10, y: 10 } }
      ];
      const { objects, report } = validateAndFilterScene(dataWithDuplicates);
      expect(objects).toHaveLength(1);
      expect(report.duplicateIds).toContain('dup');
      expect(report.discarded).toBe(1);
    });

    it('should report broken references (parentId)', () => {
      const data = [
        { id: 'child', name: 'Child', transform: { x: 0, y: 0 }, parentId: 'non-existent' }
      ];
      const { report } = validateAndFilterScene(data);
      expect(report.brokenParents).toHaveLength(1);
      expect(report.brokenParents[0]).toContain('non-existent');
    });

    it('should report broken references (childrenIds)', () => {
      const data = [
        { id: 'parent', name: 'Parent', transform: { x: 0, y: 0 }, childrenIds: ['ghost'] }
      ];
      const { report } = validateAndFilterScene(data);
      expect(report.brokenChildren).toHaveLength(1);
      expect(report.brokenChildren[0]).toContain('ghost');
    });

    it('should throw error if no valid objects are found in a non-empty array', () => {
      const invalidData = [{ foo: 'bar' }];
      expect(() => validateAndFilterScene(invalidData)).toThrow('No valid objects found in the file.');
    });

    it('should return empty array if input is empty array', () => {
      const { objects, report } = validateAndFilterScene([]);
      expect(objects).toEqual([]);
      expect(report.total).toBe(0);
    });
  });

  describe('Store Behavior', () => {
    it('setObjects should fully replace state and reset selection', () => {
      const { addObject, selectObject, setObjects } = useCanvasStore.getState();
      addObject({ id: 'old', name: 'Old', type: 'box', transform: {x:0,y:0} } as any);
      selectObject('old');
      
      const newObjects = [{ id: 'new', name: 'New', type: 'box', transform: {x:10,y:10} } as any];
      setObjects(newObjects);
      
      const state = useCanvasStore.getState();
      expect(state.objects).toHaveLength(1);
      expect(state.objects[0].id).toBe('new');
      expect(state.selectedObjectIds).toHaveLength(0);
    });

    it('should maintain round-trip integrity', () => {
      const original: GameObject[] = [{
        id: '1',
        name: 'Test',
        type: 'box',
        parentId: null,
        childrenIds: [],
        tags: ['a'],
        transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
        properties: { key: 'val' },
        logicRefs: [],
        description: 'desc',
        width: 100,
        height: 100,
        color: 'blue'
      }];
      
      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized);
      const { objects: validated } = validateAndFilterScene(deserialized);
      
      expect(validated).toEqual(original);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent parentId without crashing (UI responsibility, but store stays valid)', () => {
      const data = [{ id: '1', name: 'Broken Parent', transform: {x:0,y:0}, parentId: 'ghost' }];
      const { objects: validated } = validateAndFilterScene(data);
      expect(validated[0].parentId).toBe('ghost');
    });

    it('should handle circular children references in data (store stays valid)', () => {
      // Logic-wise, childrenIds are just strings in the store. 
      // The UI (Hierarchy) handles the actual recursion safety.
      const data = [
        { id: 'A', name: 'A', transform: {x:0,y:0}, childrenIds: ['B'] },
        { id: 'B', name: 'B', transform: {x:0,y:0}, childrenIds: ['A'] }
      ];
      const { objects: validated } = validateAndFilterScene(data);
      expect(validated).toHaveLength(2);
    });
  });
});
