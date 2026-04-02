---
name: ui-data-tester
description: Use this skill when testing UI behavior, scene JSON flows, import/export, cleanup, validation, classes, inheritance, and Dev JSON harness workflows.
---

# Skill: UI Data Tester
...

# Skill: UI Data Tester

## Назначение
Этот skill используется, когда нужно проверить фазу не только “по коду”, а через реальное поведение UI, данных и JSON-состояния.

Он нужен для задач, где важно:
- реально прокликать интерфейс;
- проверить import/export;
- проверить broken JSON / cleanup / validation;
- проверить classes / inheritance / logic links;
- использовать встроенный `Dev JSON` harness вместо скачивания файлов.

---

## Когда использовать
Используй этот skill, если задача связана с:
- UI-кликабельностью;
- переключением вкладок / панелей;
- import/export;
- validation;
- cleanup;
- text logic;
- classes/templates;
- inheritance;
- broken references;
- `classId`, `parentClassId`, `relatedObjectIds`.

---

## Что обязательно прочитать перед тестом

1. `.agents/workflows/CURRENT_TASK.md`
2. `.agents/_agent_docs/ARCHITECTURE.md`
3. `.agents/_agent_docs/ENGINE_LOG.md`
4. `.agents/_agent_docs/DEV_HARNESS.md`

Если тест связан с правилами поведения:
- `.agents/_agent_docs/DECISIONS.md`

---

## Главный принцип
Не считать фазу подтверждённой только потому, что:
- код компилируется;
- логика выглядит правильной;
- store меняется как ожидается;
- тест “мысленно должен пройти”.

Нужно по возможности подтверждать результат:
- через реальные клики,
- через реальный UI,
- через реальный JSON,
- через реальную реакцию приложения.

---

## Как тестировать UI

### 1. Проверка кликабельности
Если в задаче есть новый UI-элемент:
- реально кликни по нему;
- убедись, что клик срабатывает;
- убедись, что элемент не перекрыт layout-слоем;
- проверь, нет ли проблем с `pointer-events`, `z-index`, `position`.

### 2. Проверка переключений
Если есть вкладки / панели / секции:
- открой
- закрой
- вернись назад
- быстро попереключай
- убедись, что UI не залипает и не ломается

### 3. Проверка данных через UI
Если UI должен менять данные:
- измени значение
- переключись на другой объект/панель
- вернись назад
- убедись, что данные реально сохранились

---

## Как тестировать JSON и импорт/экспорт

### Не полагайся на downloads/temp
Если задача связана с JSON, import/export или broken data:
- не завязывай тест на скачивание файла, если это можно обойти;
- сначала используй `Dev JSON` harness.

### Предпочтительный workflow
1. открыть `Dev JSON`
2. нажать `Load Current Scene`
3. убедиться, что JSON появился в textarea
4. при необходимости изменить JSON вручную
5. нажать `Apply JSON`
6. проверить:
   - UI
   - консоль
   - итоговое состояние

---

## Как делать broken-data тесты

Используй либо встроенные mutation helpers, либо ручную правку JSON в `Dev JSON`.

Типовые сценарии:
- broken `relatedObjectIds`
- broken `classId`
- broken `parentClassId`
- missing `objectClasses`
- missing `logicItems`
- legacy scene format
- invalid / partial scene state

### Нужно проверить
- приложение не падает;
- cleanup / sanitization срабатывают;
- UI остаётся рабочим;
- консоль даёт понятную диагностику.

---

## Как тестировать классы и наследование

### Для classes/templates
Проверяй:
- создание класса
- редактирование класса
- назначение класса объекту
- снятие класса
- удаление класса
- persistence через export/import

### Для inheritance
Проверяй:
- базовый parent/child сценарий
- override child > parent
- merge tags
- merge properties
- cycle prevention
- export/import parentClassId

---

## Что делать, если что-то нельзя подтвердить полностью
Если тест невозможен полностью из-за ограничений среды:
- не выдумывай успех;
- явно пометь это как:
  - `NOT_FULLY_VERIFIED`
  - `NEEDS_MANUAL_CHECK`
  - `BLOCKED_BY_ENVIRONMENT`
- напиши, что именно не удалось подтвердить.

Пример:
- `window.confirm` auto-dismiss в тестовом браузере
- file picker неинтерактивен
- download path недоступен
- harness не открывается из-за overlay

---

## Как оформлять результат теста

После теста отвечай чётко и предметно:

1. Что именно было протестировано
2. Какие сценарии прошли
3. Какие сценарии не прошли
4. Что выглядит как реальный баг
5. Что не удалось проверить из-за ограничений среды
6. Какие данные / UI / логи это подтверждают

---

## Как отмечать проблемы
Если найден баг:
- не размазывай;
- назови конкретный сценарий;
- скажи, что ожидалось;
- скажи, что произошло фактически;
- укажи, где, скорее всего, причина.

### Хороший формат
- Scenario: delete class
- Expected: class disappears, object remains, classId becomes null
- Actual: class stays in list
- Likely cause: delete flow blocked by confirm / stale UI state / store update not reflected

---

## Что не делать
Не надо:
- писать “всё работает”, если не кликал;
- подменять UI-тест размышлением о коде;
- считать JSON-поток проверенным без реального `Load Current Scene` / `Apply JSON`;
- маскировать непроверенные части красивым отчётом.

---

## Специальное правило для Agenix
Если можно использовать `Dev JSON` harness — используй его.
Он предпочтительнее:
- downloads
- temp paths
- hidden file inputs
- нестабильных browser download flows

---

## Ключевая мысль
Твоя задача — не просто “похоже, что работает”, а **доказать это через реальное поведение UI и данных там, где это возможно**.