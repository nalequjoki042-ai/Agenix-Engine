# Decisions

## Format
Каждое решение записывается так:

### [DATE] Title
- Status: accepted / changed / deprecated
- Context:
- Decision:
- Why:
- Consequences:

---

### [2026-03-28] V1 scope is editor-first
- Status: accepted
- Context: проект рисковал расползтись в AI, graph и runtime.
- Decision: v1 строится как фундамент редактора сцены.
- Why: без сильного editor core дальнейшие слои будут нестабильны.
- Consequences: AI, graph и сложная логика отложены.

### [2026-03-28] Current core entities
- Status: accepted
- Context: нужна минимальная модель данных для v1.
- Decision: опираться на Object Instance, Object Template/Class, Logic Reference.
- Why: этого достаточно для hierarchy, inspector и расширяемости.
- Consequences: не вводим пока сложную inheritance/component model.