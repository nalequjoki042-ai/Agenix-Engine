import type { ObjectClass } from '../types/objectClass';

export const BROKEN_PARENT_OPTION_VALUE = '__broken__';

export type InvalidParentSelectionReason = 'self' | 'cycle';

export type ParentLinkState = 'None' | 'Assigned' | 'Broken Link';

export type ParentOptionStatus = 'available' | 'self' | 'cycle';

export type ParentOption = {
  id: string;
  label: string;
  status: ParentOptionStatus;
};

export type ClassParentUiState = {
  currentParentName: string;
  linkState: ParentLinkState;
  note: string;
  selectorValue: string;
  brokenParentId: string | null;
  options: ParentOption[];
};

export const getInvalidParentSelectionReason = (
  childId: string,
  proposedParentId: string | null,
  objectClasses: ObjectClass[]
): InvalidParentSelectionReason | null => {
  if (!proposedParentId) return null;
  if (childId === proposedParentId) return 'self';

  let currentParentId: string | null = proposedParentId;
  const visited = new Set<string>();

  while (currentParentId) {
    if (currentParentId === childId) return 'cycle';
    if (visited.has(currentParentId)) return 'cycle';
    visited.add(currentParentId);

    const parentClass = objectClasses.find(objectClass => objectClass.id === currentParentId);
    if (!parentClass) break;
    currentParentId = parentClass.parentClassId;
  }

  return null;
};

export const wouldCauseClassCycle = (
  childId: string,
  proposedParentId: string | null,
  objectClasses: ObjectClass[]
): boolean => getInvalidParentSelectionReason(childId, proposedParentId, objectClasses) !== null;

export const getClassParentUiState = (
  objectClass: ObjectClass,
  objectClasses: ObjectClass[]
): ClassParentUiState => {
  const currentParent = objectClass.parentClassId
    ? objectClasses.find(candidate => candidate.id === objectClass.parentClassId) || null
    : null;

  const brokenParentId = objectClass.parentClassId && !currentParent
    ? objectClass.parentClassId
    : null;

  const options = objectClasses.map(candidate => {
    const reason = getInvalidParentSelectionReason(objectClass.id, candidate.id, objectClasses);
    const status: ParentOptionStatus = reason || 'available';

    if (status === 'self') {
      return {
        id: candidate.id,
        label: `${candidate.name} (self blocked)`,
        status
      };
    }

    if (status === 'cycle') {
      return {
        id: candidate.id,
        label: `${candidate.name} (cycle blocked)`,
        status
      };
    }

    return {
      id: candidate.id,
      label: candidate.name,
      status
    };
  });

  if (!objectClass.parentClassId) {
    return {
      currentParentName: 'None',
      linkState: 'None',
      note: 'No parent class. This class keeps its own defaults.',
      selectorValue: '',
      brokenParentId: null,
      options
    };
  }

  if (brokenParentId) {
    return {
      currentParentName: `Missing (${brokenParentId})`,
      linkState: 'Broken Link',
      note: 'Current parent link is broken. Clear it or choose another parent.',
      selectorValue: BROKEN_PARENT_OPTION_VALUE,
      brokenParentId,
      options
    };
  }

  return {
    currentParentName: currentParent?.name || 'None',
    linkState: 'Assigned',
    note: 'Child inherits missing defaults from the parent chain.',
    selectorValue: objectClass.parentClassId,
    brokenParentId: null,
    options
  };
};
