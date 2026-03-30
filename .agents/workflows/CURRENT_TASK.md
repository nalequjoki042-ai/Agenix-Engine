# CURRENT TASK

## Active Phase
Phase 9E — Text Logic Persistence

## Goal
Finish the current text-logic milestone by making `logicItems` persist together with the scene during Export / Import.

## Why this is the active task
The project already has:
- a separate text-logic data layer in the store (`logicItems`);
- a dedicated `LogicPanel` for creating and editing text rules;
- `Inspector` integration via the `Scenario Rules` section.

The missing piece is persistence:
- text logic currently lives only in memory;
- after export/import or page reload it is lost;
- old scene export/import still focuses on `objects`.

## What must be implemented

### 1. Update scene export format
Export scene data as an object:

```ts
{
  objects: GameObject[];
  logicItems: LogicTextItem[];
}

2. Keep backward compatibility on import

Import must support both formats:

Old format
GameObject[]
New format
{
  objects: GameObject[];
  logicItems: LogicTextItem[];
}
3. Import behavior
If old format is imported:
treat the array as objects
use logicItems: []
If new format is imported:
restore both objects and logicItems
If logicItems is missing:
use an empty array
If some logicItems are invalid:
ignore only invalid items
do not crash
keep valid items
If objects are invalid:
do not overwrite the current scene
4. Validation requirements for logicItems

Each imported LogicTextItem must have:

id: string
title: string
text: string
relatedObjectIds: string[]
enabled: boolean
tags: string[]
notes: string
Files that are likely relevant
src/App.tsx
src/store/useCanvasStore.ts
src/types/logic.ts
src/utils/sceneValidation.ts
optionally a new validation helper for text logic if really needed
Scope boundaries
Allowed
extend export/import logic
extend validation
add a safe store action for replacing full scene state if needed
make minimal forced UI adaptations only if required by new persistence flow
Not allowed
no runtime execution
no graph view
no AI parsing
no DSL / scripting layer
no redesign of LogicPanel
no redesign of Inspector
no migration/removal of old logicRefs
no cleanup system for dangling relatedObjectIds
no unrelated refactor
Acceptance criteria

This task is complete only if all of the following are true:

User creates objects
User creates text logic rules
User links text logic rules to objects
User clicks Export
Exported JSON actually contains:
objects
logicItems
User imports the exported file back
After import:
objects are restored
text logic rules are restored
links in relatedObjectIds are preserved
rules are visible in LogicPanel
related rules are visible in Inspector
Required manual verification

After implementation, explicitly verify this scenario by hand:

create scene
add at least one logic rule
export
open exported JSON and confirm logicItems is present
import the same file
confirm rules are restored in both LogicPanel and Inspector
Output expectations for the agent

After completion, the agent must report:

What was changed
Which files were modified
Why text logic was previously lost
What works now
What was intentionally NOT changed
What was manually verified
Documentation update required after completion
update .agents/_agent_docs/ENGINE_LOG.md
update .agents/_agent_docs/DECISIONS.md only if a new architectural decision was made
do not rewrite unrelated agent documents