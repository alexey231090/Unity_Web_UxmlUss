# План реализации Drag-and-Drop

## Цель
Добавить возможность перетаскивания блоков UXML для изменения их порядка и вложенности.

## Изменения

### 1. CSS (style.css)
Добавить стили для визуальной обратной связи:
- `.scratch-block.dragging` — полупрозрачность и уменьшение размера при перетаскивании.
- `.scratch-block.drag-over` — подсветка границы при наведении.
- `.block-children.drag-over` — подсветка зоны вложенности.
- `.drag-ghost` — полупрозрачный призрак при перетаскивании.

### 2. JavaScript (script.js)
Добавить логику drag-and-drop:

#### Глобальные переменные
- `draggedBlock = null`
- `dropTarget = null`
- `dragGhost = null`

#### Функции
- `initDragAndDrop(block)` — инициализация событий drag для блока.
- `createDragGhost(event)` — создание призрака.
- `handleDragStart(event)` — начало перетаскивания.
- `handleDragOver(event)` — обработка наведения.
- `handleDrop(event)` — обработка отпускания.
- `handleDragEnd(event)` — завершение перетаскивания.

#### Интеграция
- В `createBlock` добавить `div.setAttribute('draggable', true)` и вызов `initDragAndDrop`.
- При изменении структуры DOM вызывать `updateBlockLinks`.

### 3. Логика drop
Определить возможные места для вставки:
- Корневой контейнер `.scratch-canvas`
- Контейнеры `.block-children`
- Позиция: перед/после/внутри (если контейнер пустой).

### 4. Обновление данных
После успешного drop обновить DOM и вызвать `updateBlockLinks`.

## Последовательность действий
1. Добавить CSS стили.
2. Добавить функции drag-and-drop в script.js.
3. Модифицировать createBlock.
4. Протестировать функциональность.