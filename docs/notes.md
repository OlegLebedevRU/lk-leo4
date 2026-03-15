# Documentation / Документация

## METHOD_CODES - Конфигурация методов задач

Конфигурация method codes хранится в JSON файле [`src/features/tasks/domain/methodCodes.json`](../src/features/tasks/domain/methodCodes.json).

### Структура JSON

```json
{
  "methodCodes": [
    {
      "code": 16,
      "label": "16 - Привязка карты/пинкода к слоту",
      "description": "Привязка ID карты/пинкода к слоту/ячейке",
      "dropdownTooltip": "Привязка ID карты/пинкода к слоту/ячейке",
      "supportsMultiple": true,
      "dtFormat": "objectArray",
      "dtFields": [...]
    }
  ]
}
```

### Ограничения формата dt

Для новых записей формат списка `dt` строго ограничен:

| dtFormat | Результат | Пример |
|----------|-----------|--------|
| `objectArray` | Список объектов | `[{cd: "123", cl: 1}]` |
| `stringArray` | Список строк | `["pin123"]` |
| `numberArray` | Список целых чисел | `[1, 2, 3]` |
| `empty` | Пустой массив | `[]` |

### Как добавить новый method code

1. Откройте файл [`src/features/tasks/domain/methodCodes.json`](../src/features/tasks/domain/methodCodes.json)
2. Добавьте новую запись в массив `methodCodes`:

```json
{
  "code": 99,
  "label": "99 - Новый метод",
  "description": "Описание метода",
  "dropdownTooltip": "Подсказка в выпадающем списке",
  "dtFormat": "stringArray",
  "dtFields": [
    {
      "fieldName": "dt_value",
      "label": "Значение",
      "type": "string",
      "defaultValue": "",
      "example": "пример",
      "tooltip": "Подсказка"
    }
  ]
}
```

#### Параметры method code

| Параметр | Тип | Описание |
|----------|-----|----------|
| `code` | number | Уникальный код метода |
| `label` | string | Отображаемое название |
| `description` | string | Описание метода |
| `dropdownTooltip` | string | Подсказка в выпадающем списке |
| `dtFormat` | string | Формат dt: `objectArray`, `stringArray`, `numberArray`, `empty` |
| `objectField` | string | Имя поля для objectArray (например, `mt` для `{mt: value}`) |
| `supportsMultiple` | boolean | Поддержка множественных объектов |
| `dtFields` | array | Поля для ввода |

#### Параметры dtFields

| Параметр | Тип | Описание |
|----------|-----|----------|
| `fieldName` | string | Имя поля в форме |
| `label` | string | Отображаемое название |
| `type` | string | Тип: `string`, `number`, `numberArray`, `stringArray` |
| `defaultValue` | any | Значение по умолчанию |
| `example` | string | Пример значения |
| `tooltip` | string | Подсказка |
| `group` | string | Группа полей |

### Важные ограничения

1. **Существующие записи не меняют структуру** - добавление новых method codes не влияет на уже созданные задачи
2. **Строгая типизация dt** - формат списка dt всегда один из: `objectArray`, `stringArray`, `numberArray`, `empty`
3. **Обратная совместимость** - все существующие method codes (16, 20, 21, 35, 47) работают без изменений
