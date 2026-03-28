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

## [2026-03-28] Phase 5: Scene Serialization (Save/Load)
**Status:** Completed

### Summary:
Implemented basic scene export and import to/from JSON, keeping within the strict boundaries of v1.

### Changes:
- **Canvas Store**: Added `setObjects` action to `useCanvasStore.ts` to allow replacing the entire scene state.
- **App UI**:
  - Added "Import" button to the top toolbar next to the "Export" button.
  - Implemented `handleExport` which downloads `scene.json` containing the raw array of `GameObject` instances.
  - Implemented `handleImport` which uses a hidden `<input type="file">` to read and parse a JSON file, replacing the current scene via `setObjects` if valid.

### Next Steps:
- Add error boundaries/validation for imported JSON schema to avoid runtime crashes from malformed data.

## [2026-03-28] Phase 6: Comprehensive Testing (Export/Import)
**Status:** Completed

### Summary:
Performed exhaustive testing of the serialization logic using both automated tests (Vitest) and manual logic verification across 30 test cases.

### Changes:
- **Testing Infrastructure**: Installed `vitest`, `@testing-library/react`, and `jsdom`.
- **Automated Tests**: Created `src/tests/sceneSerialization.test.ts` covering core data integrity, hierarchy preservation, and edge cases like Unicode/Special characters.
- **Reporting**: Generated `TEST_REPORT.md` with detailed status for each of the 30 test cases.
- **Verification**: Confirmed that the current implementation is resilient to circular references (via `visited` Set in rendering) and malformed JSON (via `try-catch` and `Array.isArray` checks).

### Next Steps:
- Consider moving towards a more robust schema validation (e.g., Zod) as suggested in `OPEN_QUESTIONS.md`.
- Integrate vitest into the `package.json` scripts for easier CI/CD usage.

## [2026-03-28] Phase 7: Robust Scene Import & Validation
**Status:** Completed

### Summary:
Implemented a validation layer for scene imports to prevent application crashes from malformed JSON and expanded the test suite.

### Changes:
- **Validation Utility**: Created `src/utils/sceneValidation.ts` to centralize logic for verifying `GameObject` structure (`id`, `name`, `transform`).
- **Improved Import Logic**:
  - Updated `handleImport` in `App.tsx` to use the validation utility.
  - Added filtering of invalid objects (those missing mandatory fields).
  - Added specific error messages (e.g., "Scene data must be an array").
  - Ensured the current scene is not overwritten if the imported file contains zero valid objects.
- **Enhanced Testing**:
  - Updated `src/tests/sceneSerialization.test.ts` with 8 comprehensive test cases.
  - Covered edge cases: missing mandatory fields, incorrect data types, circular references (store-level), and empty inputs.

### Next Steps:
- Add UI feedback/notifications for skipped (filtered) objects during import.
- Explore adding a "Merge Scene" option vs the current "Replace Scene".

## [2026-03-28] Phase 8: Enhanced Import Validation & Reference Integrity
**Status:** Completed

### Summary:
Significantly strengthened the scene import process by adding deep validation for ID uniqueness and reference integrity.

### Changes:
- **Comprehensive Validation Utility**:
  - Updated `src/utils/sceneValidation.ts` to return a detailed `ValidationResult` including an `ImportReport`.
  - Added strict check for duplicate IDs (duplicate objects are now discarded).
  - Added cross-reference checks: `parentId` and `childrenIds` are verified against the list of existing IDs.
- **Improved UI Feedback**:
  - Updated `handleImport` in `App.tsx` to provide a detailed report in the console (`console.group`).
  - Added warnings for broken references and duplicate IDs.
  - User receives an alert summary if any issues (discarded objects or broken links) were found.
- **Updated Test Suite**:
  - Expanded `src/tests/sceneSerialization.test.ts` to cover duplicate ID filtering and broken reference reporting.
  - All 11 test cases passed.

### Next Steps:
- Consider visual indicators in the Hierarchy or Inspector for objects with broken references.
- Implement more granular "Safe Import" options (e.g., auto-cleaning broken links).
