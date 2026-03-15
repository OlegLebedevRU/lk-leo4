// src/features/events/types.ts

// Рекурсивный тип для JSON-объекта
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

// Поля события из API
export type DeviceEventApiResponse = {
  id: number;
  device_id: number;
  event_type_code: number;
  dev_event_id: number;
  created_at: string;
  dev_timestamp: string;
  payload: JsonObject;
};

// Данные для таблицы
export type EventListItem = {
  createdAt: string;
  dev_event_id: number;
  event_code: number;
  code: JsonObject;
  description?: string;
  createdAtRange?: number[];
};