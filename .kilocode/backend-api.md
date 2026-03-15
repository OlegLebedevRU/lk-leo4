# Leo4 Backend API Documentation

## Overview

IoT платформа для управления устройствами (постаматами), задачами и событиями.

## Безопасность

- Все эндпоинты требуют `x-api-key` заголовок при интеграции Сервер - Сервер
- При интеграции с фронтендом используется JWT (cookie)
- Принадлежность ресурсов к организации проверяется автоматически

## Основные разделы API

| Тег | Краткое описание |
|-----|------------------|
| **Device tasks** | Команды устройствам (создание и отслеживание задач) |
| **Device events** | Получение и фильтрация событий с пагинацией |
| **Devices** | Управление устройствами и тегами |
| **Postamats** | Работа с постаматами и ячейками |
| **Webhooks** | Настройка вебхуков |
| **Gauges** | Данные с датчиков устройств |

---

## Endpoints

### Device Tasks

#### POST /api/v1/device-tasks/
Создать задачу для устройства


**Тело:**
```json
{
  "ext_task_id": "string",
  "device_id": 123,
  "method_code": 20,
  "priority": 0,
  "ttl": 1,
  "payload": {}
}
```

#### GET /api/v1/device-tasks/
Получить список задач с пагинацией

**Параметры:**
- `device_id` (query, required)
- `page` (query, default: 1)
- `size` (query, default: 50, max: 100)

#### GET /api/v1/device-tasks/{id}
Получить задачу по ID с полными результатами

#### DELETE /api/v1/device-tasks/{id}
Удалить задачу (soft delete)

---

### Device Events

#### GET /api/v1/device-events/
Получить события устройства с пагинацией

**Параметры:**
- `device_id` (query, required)
- `events_include` (query, optional) - фильтр по кодам событий
- `events_exclude` (query, optional) - исключить коды событий
- `page` (query, default: 1)
- `size` (query, default: 50, max: 100)

**Ответ:**
```json
{
  "items": [...],
  "total": 12813,
  "page": 1,
  "size": 5,
  "pages": 2563
}
```

#### GET /api/v1/device-events/incremental
Получить инкрементальные события

**Параметры:**
- `device_id` (query, optional)
- `last_event_id` (query, optional)
- `limit` (query, default: 50, max: 100)

#### GET /api/v1/device-events/fields/
Получить агрегированные данные по полям

**Параметры:**
- `device_id` (query, required)
- `event_type_code` (query, default: 44)
- `tag` (query, default: 338)
- `interval_m` (query, default: 15, max: 3600)
- `limit` (query, default: 1, max: 10)

---

### Devices

#### GET /api/v1/devices/
Получить список устройств

**Параметры:**
- `device_id` (query, optional)

#### PUT /api/v1/devices/{device_id}
Добавить тег к устройству

**Тело:**
```json
{
  "tag": "location",
  "value": "warehouse-1"
}
```

---

### Postamats

#### GET /api/v1/postamats/
Получить все постаматы

**Параметры:**
- `skip` (query, default: 0)
- `limit` (query, default: 100)

#### GET /api/v1/postamats/{postamat_id}
Получить постамат с ячейками

#### POST /api/v1/postamats/{postamat_id}/command
Отправить команду на постамат

**Тело:**
```json
{
  "method": "open_cells",
  "params": {
    "cell_numbers": [1, 2]
  }
}
```

---

### Webhooks

#### GET /api/v1/webhooks/
Получить все вебхуки организации

#### PUT /api/v1/webhooks/{event_type}
Установить вебхук

**Тело:**
```json
{
  "url": "https://your-api.com/webhook/events",
  "headers": {
    "Authorization": "Bearer abc123"
  },
  "is_active": true
}
```

#### DELETE /api/v1/webhooks/{event_type}
Удалить вебхук

**Поддерживаемые типы событий:**
- `msg-event`
- `msg-task-result`

---

### Gauges

#### GET /api/v1/gauges/
Получить показания датчиков

**Параметры:**
- `device_id` (query, optional)
- `type` (query, optional)
- `page` (query, default: 1)
- `size` (query, default: 50, max: 100)

---

## Коды методов задач (method_code)

| Код | Описание |
|-----|----------|
| 21 | перезагрузка |
| 20 | выполнить команду |
| ... | см. [methodCodes.ts](src/features/tasks/domain/methodCodes.ts) |

## Статусы задач

| Код | Описание |
|-----|----------|
| 0 | created |
| 1 | pending |
| 2 | locked |
| 3 | completed |
| 4 | failed |
| 5 | cancelled |

## Типы событий (event_type_code)

| Код | Описание |
|-----|----------|
| 3 | открытие двери |
| 44 | периодическое событие |
| ... | см. [eventMapping.ts](src/features/events/domain/eventMapping.ts) |

---

## Ссылки на документацию

- [Управление задачами](https://github.com/OlegLebedevRU/iot-rpc-rest-app/blob/master/docs/1-task-workflow-doc.md)
- [Форматы событий](https://github.com/OlegLebedevRU/iot-rpc-rest-app/blob/master/docs/2-events-api-format-description.md)
- [Вебхуки](https://github.com/OlegLebedevRU/iot-rpc-rest-app/blob/master/docs/3-webhooks.md)
