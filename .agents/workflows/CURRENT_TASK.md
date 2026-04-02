---
description: Текущая задача проекта
---

# CURRENT TASK

## Active Phase
Phase 12D — Create Object From Class

## Status
Verified complete on 2026-04-02.

## Verification Summary
- `Create Object From Class` added in `ClassPanel`
- new object gets `classId`, `type` from class `baseType`, and safe resolved defaults
- new object is auto-selected after creation
- normal object creation and create-from-class now share the same base bootstrap helper
- manual browser verification completed
- targeted tests and build completed successfully

## Goal
Allow users to create a new scene object directly from an existing class/template, so class-based authoring becomes faster and more natural.

## Why this is the active task
The project already has:
- object classes/templates
- inheritance
- safe class application
- detach/reapply controls
- Inspector class clarity
- class impact preview
- clean baseline

Right now class workflow is still indirect:
1. create object
2. assign class
3. apply class

This works, but is not the most natural workflow.

The next practical step is direct creation:
- choose a class
- create object from that class
- get a new scene object already initialized from class defaults

## What must be implemented

### 1. Add "Create Object From Class" action
In `ClassPanel`, add a clear action:
- `Create Object From Class`

This should work for the currently selected class.

### 2. Create object with class already assigned
When user creates an object from a class:
- create a new scene object
- set `classId`
- use class `baseType` as object type
- apply safe class defaults as initial object data

That means:
- description may be filled
- tags may be added
- properties may be added
- inheritance-resolved defaults should be used if parent chain exists

### 3. Keep behavior safe and predictable
Creation from class should:
- not require a second manual "Apply Class" step
- produce a valid scene object immediately
- remain consistent with existing safe class application rules

### 4. New object UX
After creation:
- object should appear in the scene
- object should be selected automatically if this fits current editor flow
- result should feel like normal object creation, not like a hidden background mutation

### 5. Keep it minimal
This phase is not for:
- prefab system
- object factory browser
- spawn wizard
- advanced placement tool
- asset workflow expansion

Just one clean direct-create flow.

## Scope boundaries

### Allowed
- add create-from-class action in `ClassPanel`
- add store logic to create object from class
- reuse current safe apply/inheritance logic
- minimally update selection behavior if needed

### Not allowed
- no prefab instances
- no override system
- no live sync
- no graph view
- no runtime execution
- no scripting system
- no large ClassPanel redesign
- no broad scene placement tools

## Likely relevant files
- `src/components/ClassPanel.tsx`
- `src/store/useCanvasStore.ts`
- `src/types/objectClass.ts`
- existing class/inheritance helpers

## Acceptance criteria
This phase is complete only if all of the following are true:

1. User can create an object directly from selected class
2. New object gets correct `classId`
3. New object gets correct `type` from class `baseType`
4. Safe defaults are applied on creation
5. Inheritance-resolved defaults are used if needed
6. New object appears in scene without broken state
7. Flow remains simple and readable

## Required manual verification
After implementation, explicitly verify:

### Scenario A — basic create
1. create a class
2. click `Create Object From Class`
3. confirm object appears in scene

### Scenario B — assigned class
1. inspect created object
2. confirm correct `classId` is assigned

### Scenario C — safe defaults applied
1. create object from class with description/tags/properties
2. confirm defaults are present on created object

### Scenario D — inheritance
1. create object from child class with parent
2. confirm inherited defaults are also applied

### Scenario E — editor flow
1. create multiple objects from classes
2. confirm editor remains stable and understandable

## Output expectations for the agent
After completion, the agent must report:

1. What was added
2. Which files were modified
3. How create-from-class now works
4. How inheritance affects created objects
5. What was intentionally NOT done
6. Which risks / open points remain
7. What was manually verified

## Documentation update required after completion
- update `.agents/_agent_docs/ENGINE_LOG.md`
- update `.agents/workflows/CURRENT_TASK.md` only after this phase is truly verified
