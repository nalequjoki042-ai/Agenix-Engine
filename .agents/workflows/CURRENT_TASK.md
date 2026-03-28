---
description: Current Task
---

# Current Task

## Current stage
Расширение object model и inspector без выхода за рамки v1.

## Goal
Подготовить объектную модель и inspector к дальнейшему росту проекта.

## What needs to be done
1. Добавить поддержку:
- `description`
- `custom properties`
- `logicRefs`

2. Обновить inspector и разбить его на секции:
- Basic
- Transform
- Tags
- Description
- Custom Properties
- Logic References

3. Custom Properties:
- хранить как пары key/value;
- позволить добавлять, редактировать и удалять свойства.

4. Logic References:
- минимальная структура:
  - `id`
  - `name`
  - `type` (`server` | `client` | `shared`)
  - `description`
  - `enabled`
- дать возможность:
  - добавить
  - изменить
  - удалить
  - включить / выключить

## Strict limitations
Не делать:
- AI features
- graph view
- overlap/event runtime systems
- gameplay logic
- сложное наследование
- лишний UI-polish

## Result criteria
Этап считается выполненным, если:
- объект поддерживает description, custom properties и logicRefs;
- inspector позволяет всё это редактировать;
- структура остаётся быстрой, понятной и расширяемой.