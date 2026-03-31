export type ObjectClass = {
  id: string;
  name: string;
  description: string;
  baseType: 'box' | 'zone' | 'unit' | 'custom';
  defaultTags: string[];
  defaultProperties: Record<string, unknown>;
  defaultDescription: string;
  parentClassId: string | null;
};
