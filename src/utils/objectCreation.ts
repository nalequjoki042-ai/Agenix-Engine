import type { GameObject } from '../store/useCanvasStore';

export type ObjectType = GameObject['type'];

export type SpawnPosition = {
  x: number;
  y: number;
};

type CreateBaseObjectInput = {
  type: ObjectType;
  position: SpawnPosition;
  existingObjects: GameObject[];
  preferredName?: string;
  classId?: string | null;
};

const OBJECT_TYPE_DEFAULTS: Record<ObjectType, { baseName: string; color: string }> = {
  box: { baseName: 'Box', color: '#646cff' },
  zone: { baseName: 'Zone', color: 'rgba(255, 100, 100, 0.5)' },
  unit: { baseName: 'Unit', color: '#4CAF50' },
  custom: { baseName: 'Custom', color: '#646cff' }
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isValidObjectType = (value: unknown): value is ObjectType =>
  value === 'box' || value === 'zone' || value === 'unit' || value === 'custom';

export const getBaseObjectNameByType = (type: ObjectType): string => OBJECT_TYPE_DEFAULTS[type].baseName;

export const getUniqueObjectName = (
  existingObjects: GameObject[],
  type: ObjectType,
  preferredName?: string
): string => {
  const trimmedPreferredName = preferredName?.trim() || '';
  const baseName = trimmedPreferredName || getBaseObjectNameByType(type);
  const namePattern = new RegExp(`^${escapeRegExp(baseName)}(?: (\\d+))?$`);

  let highestIndex = 0;

  existingObjects.forEach(object => {
    const match = object.name.match(namePattern);
    if (!match) return;

    if (!match[1]) {
      highestIndex = Math.max(highestIndex, 1);
      return;
    }

    highestIndex = Math.max(highestIndex, Number(match[1]));
  });

  if (highestIndex <= 1) {
    return highestIndex === 0 ? baseName : `${baseName} 2`;
  }

  return `${baseName} ${highestIndex + 1}`;
};

export const createBaseObjectByType = ({
  type,
  position,
  existingObjects,
  preferredName,
  classId = null
}: CreateBaseObjectInput): GameObject => {
  const safeX = Number.isFinite(position.x) ? position.x : 0;
  const safeY = Number.isFinite(position.y) ? position.y : 0;

  return {
    id: crypto.randomUUID(),
    name: getUniqueObjectName(existingObjects, type, preferredName),
    type,
    classId,
    parentId: null,
    childrenIds: [],
    tags: [],
    transform: {
      x: safeX,
      y: safeY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    },
    properties: {},
    logicRefs: [],
    description: '',
    width: 100,
    height: 100,
    color: OBJECT_TYPE_DEFAULTS[type].color
  };
};

export const getCameraCenterSpawnPosition = (
  camera: { x: number; y: number; scale: number },
  viewport?: { width?: number; height?: number }
): { position: SpawnPosition; usedFallback: boolean } => {
  const width = viewport?.width ?? (typeof window !== 'undefined' ? window.innerWidth : undefined);
  const height = viewport?.height ?? (typeof window !== 'undefined' ? window.innerHeight : undefined);
  const scale = camera.scale;

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(camera.x) ||
    !Number.isFinite(camera.y) ||
    !Number.isFinite(scale) ||
    scale === 0
  ) {
    return {
      position: { x: 0, y: 0 },
      usedFallback: true
    };
  }

  return {
    position: {
      x: ((width as number) / 2 - camera.x) / scale,
      y: ((height as number) / 2 - camera.y) / scale
    },
    usedFallback: false
  };
};
