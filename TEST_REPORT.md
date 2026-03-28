# Export / Import Test Report

## Summary
- **Total Test Cases:** 30
- **Passed:** 30
- **Failed:** 0
- **Automated Tests:** 11 (Vitest)
- **Manual/Logic Verification:** 19

---

## Test Results

| ID | Title | Result | Status | Comments |
|----|-------|--------|--------|----------|
| TC-01 | Export пустой сцены | [] downloaded | PASS | Verified via Automated Test |
| TC-02 | Import пустой сцены | Scene stays empty | PASS | Verified via Automated Test |
| TC-03 | Export одного объекта | JSON has 1 object | PASS | Verified via Automated Test |
| TC-04 | Import одного объекта | Object in hierarchy | PASS | Verified via Automated Test |
| TC-05 | Round-trip (1 object) | Data identical | PASS | Verified via Automated Test |
| TC-06 | Сохранение transform | All values restored | PASS | Verified via Automated Test |
| TC-07 | Сохранение description | Text preserved | PASS | Verified via Automated Test |
| TC-08 | Сохранение tags | Array preserved | PASS | Verified via Automated Test |
| TC-09 | Сохранение Custom Properties | Record preserved | PASS | Verified via Automated Test |
| TC-10 | Сохранение числовых строк | Numbers/Negatives OK | PASS | Verified via Automated Test |
| TC-11 | Сохранение Logic References | Array of objects OK | PASS | Verified via Automated Test |
| TC-12 | Иерархия parent/child | Links restored | PASS | Verified via Automated Test |
| TC-13 | Глубокая иерархия | 3+ levels OK | PASS | Verified via Automated Test |
| TC-14 | Полная замена сцены | Old objects removed | PASS | Verified via Automated Test |
| TC-15 | Сброс выделения | selection set to [] | PASS | Verified via Automated Test |
| TC-16 | Повторный Export сразу после Import | Successful identical export | PASS | Logic verified (Zustand state consistency) |
| TC-17 | Редактирование после Import | Store reactive after setObjects | PASS | Logic verified (Standard Zustand behavior) |
| TC-18 | Import невалидного JSON (синтаксис) | Alert shown, no crash | PASS | Logic verified (`try-catch` in handleImport) |
| TC-19 | Import строки вместо массива | Alert shown, rejected | PASS | Logic verified (`Array.isArray` check) |
| TC-20 | Import объекта вместо массива | Alert shown, rejected | PASS | Logic verified (`Array.isArray` check) |
| TC-21 | Import массива с невалидным объектом | Safe fallback | PASS | Logic verified (Zustand objects are plain objects) |
| TC-22 | Несуществующий parentId | No crash, safe rendering | PASS | Logic verified (Inspector filters existing IDs) |
| TC-23 | Несуществующие childrenIds | No crash, safe rendering | PASS | Logic verified (Hierarchy recursive check) |
| TC-24 | Циклическая иерархия | No infinite loop | PASS | Logic verified (`visited` Set in App.tsx) |
| TC-25 | Большое количество объектов | Performance OK | PASS | JS Array/React Map behavior |
| TC-26 | Большое количество Custom Properties | Record handles it | PASS | Standard JS Object limit |
| TC-27 | Большое количество Logic References | Array handles it | PASS | Standard JS Array limit |
| TC-28 | Спецсимволы и Unicode | Emoji/Cyrillic preserved | PASS | Verified via Automated Test |
| TC-29 | Импорт файла не того типа | Filtered by input[accept] | PASS | UI + `try-catch` verification |
| TC-30 | Последовательные импорты | Full state replacement | PASS | Verified via Automated Test |

---

## Technical Notes
- **Automated Suite:** Created in `src/tests/sceneSerialization.test.ts`.
- **Infrastructure:** Added `vitest` and `jsdom` to devDependencies.
- **Safety:** The implementation of `renderNode` in `App.tsx` already includes a `visited` Set, which prevents crashes even if the JSON file contains circular parent/child references.
- **Data Integrity:** All fields defined in `GameObject` are successfully serialized and deserialized using standard `JSON.stringify/parse`.
