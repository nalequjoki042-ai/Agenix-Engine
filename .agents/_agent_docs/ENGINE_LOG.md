# Engine Log

## [2026-03-28] Phase 4: Object Model & Inspector Refactoring
**Status:** Completed

### Summary:
Expanded the core data model and reorganized the Inspector UI to handle complex object properties and logic references. Fixed critical selection-related state issues.

### Changes:
- **Object Model**: Added `description`, `properties` (Record), and `logicRefs` (LogicRef array) to `GameObject` in `useCanvasStore.ts`.
- **Refactoring**: Extracted the massive inline Inspector from `App.tsx` into a dedicated `src/components/Inspector.tsx`.
- **UI Enhancements**:
  - New "Custom Properties" section with dynamic key-value pair editing (Add/Edit/Delete).
  - New "Logic References" section with support for logical links (Name, Type, Description, Enabled toggle).
  - Added dedicated "Description" and "Tags" sections.
  - Organized Inspector into visual blocks (Basic, Transform, Tags, Description, Properties, Logic).
- **Bug Fix**: Implemented the `key={selectedObject.id}` pattern on the Inspector root to force a full state reset when switching between objects. This prevents data contamination between selected entities.

### Next Steps:
- Prepare for the "Logic Model" phase.
- Consider adding collapsible sections if the Inspector grows too long.
- Explore basic validation for custom property keys.
