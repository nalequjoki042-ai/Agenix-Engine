---
description: Текущая задача проекта
---

# CURRENT TASK

## Active Phase
Phase 11F — Test & Build Hygiene

## Phase Status
- Status: Completed and verified on 2026-04-02.
- Scenario 1 (tests): passed.
- Scenario 2 (build): passed.
- Scenario 3 (regression sanity): passed (class flow + import/export + text logic smoke).

## Goal
Stabilize the project after recent class/template work by fixing pre-existing test/build issues and making the development workflow cleaner and more reliable.

## Why this is the active task
The project already has:
- object classes/templates
- class inheritance
- safe class application
- detach/reapply controls
- Dev JSON harness
- text logic
- import/export
- validation/cleanup

However, there are still hygiene issues:
- `npm run build` is affected by outdated test fixtures / test expectations
- some test data no longer matches the current object model
- this creates noise and reduces trust in the project state

Before adding more features, the project should have a cleaner baseline.

## What must be implemented

### 1. Fix outdated tests/fixtures
Update pre-existing tests and fixtures so they match the current data model.

Most importantly:
- object fixtures must include required fields such as `classId`
- scene import/export expectations must reflect current scene shape where relevant

### 2. Restore clean test flow
Make sure relevant project tests pass again.

At minimum:
- existing serialization/import-related tests should be brought back into a healthy state
- new class-related tests should continue to pass

### 3. Restore clean build flow
Investigate and fix issues that cause `npm run build` to fail if they are caused by outdated tests/types/fixtures within current project scope.

### 4. Keep this phase narrow
This phase is not for adding product features.
It is only for:
- test cleanup
- fixture cleanup
- type/build hygiene
- consistency fixes

## Scope boundaries

### Allowed
- update tests
- update test fixtures
- update outdated type assumptions in tests
- make small supporting fixes required for clean build/test flow

### Not allowed
- no new product features
- no new UI panels
- no new runtime systems
- no graph view
- no scripting system
- no prefab expansion
- no broad refactor outside hygiene scope

## Likely relevant files
- `src/tests/sceneSerialization.test.ts`
- `src/tests/classActions.test.ts`
- `src/types/*`
- `src/utils/sceneValidation.ts`
- `src/store/useCanvasStore.ts`
- other files only if required to restore consistency

## Acceptance criteria
This phase is complete only if all of the following are true:

1. Pre-existing outdated tests are updated to current data model
2. Relevant tests pass
3. Build is no longer failing due to outdated fixtures/types within current scope
4. No new product feature scope was added
5. The project baseline is cleaner and more trustworthy

## Required manual verification
After implementation, explicitly verify:

### Scenario A — tests
1. run relevant test files
2. confirm current expected tests pass

### Scenario B — build
1. run build
2. confirm build no longer fails because of outdated fixture/type mismatch in current scope

### Scenario C — regression sanity
1. confirm recent class/template flows are still intact
2. confirm recent text logic/import flows were not broken by hygiene work

## Output expectations for the agent
After completion, the agent must report:

1. What was fixed
2. Which files were modified
3. Which test/build issues were resolved
4. What still remains out of scope, if anything
5. What was intentionally NOT changed
6. What was manually verified

## Documentation update required after completion
- update `.agents/_agent_docs/ENGINE_LOG.md`
- update `.agents/workflows/CURRENT_TASK.md` only after this phase is truly verified
