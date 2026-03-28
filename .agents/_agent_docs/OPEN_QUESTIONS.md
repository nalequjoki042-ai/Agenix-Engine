# Open Questions

## Rules
Сюда попадают только реально не решённые вопросы.
Если решение принято — переносить в `DECISIONS.md`.

---

## Current open questions

### 1. Class vs Template
- Что именно означает `className` в v1?
- Это просто ссылка на шаблон или уже будущий тип наследования?

### 2. Properties typing
- Насколько строго типизировать custom properties на раннем этапе?
- Оставляем `Record<string, unknown>` или вводим ограниченный тип значений?

### 3. LogicRefs growth path
- Как later-stage logicRefs будут переходить в logic model?
- Нужен ли уже сейчас reserved field под event/action shape?

### 4. Hierarchy future UX
- Когда вводить collapse/expand?
- Когда вводить filters/search/hidden state?