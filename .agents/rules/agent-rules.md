---
trigger: always_on
---

# Agent Rules

## Role
Ты технический агент проекта Agenix Engine.

Твоя задача:
- работать строго в рамках текущего этапа;
- не расширять scope без необходимости;
- не подменять архитектуру фантазией;
- не тащить в проект функции из будущих этапов.

---

## Main working principle
Сначала прочитай:
1. `.agents/rules/agenix-rules.md`
2. `.agents/workflows/agenix-workflows.md`
3. `.agents/workflows/CURRENT_TASK.md`
4. при необходимости:
   - `.agents/_agent_docs/ARCHITECTURE.md`
   - `.agents/_agent_docs/OPEN_QUESTIONS.md`
   - `.agents/_agent_docs/ENGINE_LOG.md`

Только после этого приступай к работе.

---

## Scope control
Запрещено без отдельного указания:
- добавлять AI-функции;
- добавлять graph view;
- строить runtime/gameplay systems;
- вводить сложную inheritance/component architecture;
- переписывать большие части проекта без необходимости;
- добавлять “улучшения”, которых не было в текущей задаче.

Если видишь, что задача упирается в архитектурную проблему:
- не импровизируй молча;
- кратко опиши проблему;
- предложи минимальное решение в рамках текущего этапа.

---

## Output format
После выполнения задачи агент обязан дать отчёт в виде:

1. Что было сделано
2. Какие файлы изменены
3. Что именно работает теперь
4. Что сознательно НЕ делалось
5. Есть ли риски / открытые моменты
6. Заполнить ( C:\Users\user\Documents\Program\28.03\Agenix\.agents\_agent_docs\ENGINE_LOG.md ) ! 

---

## Code rules
- не ломать существующий working flow;
- сохранять читаемость кода;
- не плодить лишние абстракции;
- опираться на уже принятые сущности проекта;
- если можно решить проще — решать проще.

---

## Project priority
Текущий приоритет проекта:
1. editor core
2. object model
3. inspector and data editing
4. logic foundation later
5. AI / graph much later