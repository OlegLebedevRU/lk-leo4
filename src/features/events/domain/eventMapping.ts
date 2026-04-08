// src/features/events/domain/eventMapping.ts
import type { DeviceEventApiResponse, EventListItem, JsonObject } from '../types';

// Функция формирования описания события
export const getEventDescription = (item: EventListItem): string => {
  const { event_code, code: payload } = item;

  if (!payload || typeof payload !== "object") {
    return "—";
  }

  if (typeof payload["200"] === "number" && payload["200"] === 0) {
    return "Старт устройства";
  }

  switch (event_code) {
    case 44:
      return "Пинг";
    case 45:
      return "Кнопка";
    case 52: {
      // STM32_BIN_LOAD_RESULT
      const entries = payload["300"];
      if (Array.isArray(entries) && entries.length > 0) {
        const first = entries[0];
        if (first && typeof first === "object") {
          const resultCode = (first as JsonObject)["341"];
          const detail = (first as JsonObject)["342"];
          if (typeof resultCode === "string") {
            return `STM32 BIN загрузка: ${resultCode}${typeof detail === "string" ? ` — ${detail}` : ""}`;
          }
        }
      }
      return "STM32_BIN_LOAD_RESULT";
    }
    case 53: {
      // STM32_FW_UPDATE_RESULT
      const entries = payload["300"];
      if (Array.isArray(entries) && entries.length > 0) {
        const first = entries[0];
        if (first && typeof first === "object") {
          const status = (first as JsonObject)["348"];
          if (typeof status === "string") {
            return `STM32 прошивка: ${status}`;
          }
        }
      }
      return "STM32_FW_UPDATE_RESULT";
    }
    case 3: {
      const entries = payload["300"];
      if (Array.isArray(entries) && entries.length > 0) {
        const first = entries[0];
        if (first && typeof first === "object" && "301" in first) {
          const card = (first as JsonObject)["301"];
          if (typeof card === "string" || typeof card === "number") {
            return `Карта/пинкод = ${card}`;
          }
        }
      }
      return "—";
    }
    case 14:
    case 13: {
      const entries = payload["300"];
      if (Array.isArray(entries) && entries.length > 0) {
        const first = entries[0];
        if (first && typeof first === "object") {
          const board = (first as JsonObject)["305"];
          const port = (first as JsonObject)["306"];

          const hasBoard = typeof board === "number";
          const hasPort = typeof port === "number";

          if (!hasBoard && !hasPort) {
            return "—";
          }

          const action = event_code === 14 ? "Закрыли" : "Открыли";
          return `${action} замок, плата = ${hasBoard ? board : "?"}, порт = ${hasPort ? port : "?"}`;
        }
      }
      return "—";
    }
    default:
      return `Код ${event_code}`;
  }
};

export function mapEventsToListItems(events: DeviceEventApiResponse[]): EventListItem[] {
  return events.map((event) => ({
    createdAt: event.created_at,
    dev_event_id: event.dev_event_id,
    event_code: event.event_type_code,
    code: event.payload,
  }));
}