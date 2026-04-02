---
description: Текущая задача проекта
---

# CURRENT TASK

## Active Phase
Phase 13A — Override Visibility

## Goal
Make it clear which object values already differ from class defaults, without adding a heavy override system.

## Why this is the active task
The project already has:
- classes/templates
- inheritance
- safe class application
- detach/reapply controls
- class clarity in Inspector
- create-from-class workflow

Now the next usability gap is override visibility:
users need to understand when an object still matches its class and when it already diverges from class defaults.

This phase adds visibility only.
It does not add live sync, destructive reset, or a full override editor.

## What must be implemented

### 1. Show override status in Inspector
For class-relevant object data, show whether the object currently:
- matches class defaults
- matches inherited defaults
- differs from class defaults

At minimum cover:
- Description
- Tags
- Custom Properties

### 2. Keep it lightweight
Use compact section-level or summary-level indicators.
Do not build a large diff system.

### 3. Make wording understandable
Use wording that is clear for non-programmer workflow.
Do not imply hidden sync or destructive behavior.

### 4. Keep current class behavior unchanged
Do not change:
- assign
- detach
- reapply
- create-from-class
- inheritance mechanics

## Scope boundaries

### Allowed
- improve Inspector visibility
- add compact override indicators
- add helper logic for comparison against resolved class defaults

### Not allowed
- no override editor
- no live sync
- no prefab system
- no graph view
- no scripting system
- no runtime changes
- no large Inspector redesign

## Likely relevant files
- `src/components/Inspector.tsx`
- `src/utils/classSourceHints.ts`
- class/inheritance helpers if needed

## Acceptance criteria
This phase is complete only if all of the following are true:

1. User can tell whether object values still match class defaults
2. User can tell when object values differ from class defaults
3. Inherited defaults are considered correctly
4. UI stays compact and readable
5. Existing class workflow remains stable

## Required manual verification
After implementation, explicitly verify:

### Scenario A — matches class
1. create object from class
2. confirm Inspector shows it still matches class defaults

### Scenario B — diverges
1. change object description/tag/property manually
2. confirm Inspector now shows difference from class defaults

### Scenario C — inherited match
1. use child class with parent
2. confirm inherited defaults are considered correctly

### Scenario D — readability
1. inspect several objects
2. confirm UI remains understandable and not cluttered

## Output expectations for the agent
After completion, the agent must report:

1. What was added
2. Which files were modified
3. How override visibility now works
4. What was intentionally NOT done
5. Which risks / open points remain
6. What was manually verified
7. Whether dev server was started/stopped and on which port