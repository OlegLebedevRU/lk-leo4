// src/features/tasks/domain/taskMapping.ts
import type { ApiDeviceTaskResponse, FullTaskDetail, TaskListItem, DeviceTaskPayload, NewDeviceTask, NewDeviceTaskFormValues } from '../types';

// Универсальная функция форматирования даты
export const formatTimestamp = (ts: unknown): string => {
  try {
    if (typeof ts === 'number' && !isNaN(ts) && ts > 0) {
      // Если это timestamp в секундах
      return new Date(ts * 1000).toLocaleString('ru-RU');
    }
    if (typeof ts === 'string' && ts.trim() !== '') {
      // Если ISO-строка (например, "2026-03-13T10:59:36.594Z")
      const date = new Date(ts);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('ru-RU');
      }
    }
    console.warn('Некорректная дата:', ts);
    return '—';
  } catch (e) {
    console.error('Ошибка парсинга даты:', e, ts);
    return '—';
  }
};

// Безопасное получение числа
export const getNumber = (value: unknown, fallback: number = -1): number => {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
};

export function mapTasksToListItems(tasks: Array<{
  id: string;
  created_at: string;
  status: number;
  method_code: number;
  priority: number;
  ttl: number;
}>): TaskListItem[] {
  return tasks.map((task) => ({
    created_at: formatTimestamp(task.created_at),
    method_code: getNumber(task.method_code, -1),
    priority: getNumber(task.priority, 0),
    ttl_minutes: Math.ceil(getNumber(task.ttl, 0) / 60),
    status: getNumber(task.status, -1),
    task_id: task.id,
  }));
}

export function mapApiResponseToFullTaskDetail(data: ApiDeviceTaskResponse): FullTaskDetail {
  const detail: FullTaskDetail = {
    id: data.id,
    created_at: formatTimestamp(data.created_at),
    status: getNumber(data.status, -1),
    ext_task_id: data.header?.ext_task_id ?? '—',
    method_code: getNumber(data.header?.method_code, -1),
    priority: getNumber(data.header?.priority, 0),
    ttl_minutes: Math.ceil(getNumber(data.header?.ttl, 0) / 60),
  };

  if (data.results && data.results.length > 0) {
    detail.allResults = data.results;
    detail.result = data.results[0].result;
  }

  return detail;
}

// Функции для создания задачи
export function formatJson(value: string): string {
  if (!value.trim()) return value;
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2); // 2 пробела для отступов
  } catch {
    // Если JSON невалиден, возвращаем как есть (чтобы не ломать ввод)
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parsePayload(payloadText: string | undefined): DeviceTaskPayload | undefined {
  const raw = payloadText?.trim();
  if (!raw) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('payload должен быть валидным JSON');
  }

  if (!isRecord(parsed)) {
    throw new Error('payload должен быть объектом');
  }

  const dt = parsed.dt;
  if (!Array.isArray(dt)) {
    throw new Error('payload должен содержать массив объектов в поле "dt"');
  }
  if (!dt.every(isRecord)) {
    throw new Error('payload.dt должен быть массивом объектов');
  }

  return parsed as DeviceTaskPayload;
}

export function toNewDeviceTaskRequest(values: NewDeviceTaskFormValues): NewDeviceTask {
  const { dt: dtString, ...rest } = values;
  const payload = parsePayload(dtString);
  return {
    ...rest,
    ...(payload ? { payload } : {}),
  };
}

export function buildPacketPreview(values: NewDeviceTaskFormValues): string {
  try {
    return JSON.stringify(toNewDeviceTaskRequest(values), null, 2);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return JSON.stringify(
      {
        ...values,
        payload_error: errorMessage,
      },
      null,
      2,
    );
  }
}

// Генерация случайного ext_task_id
export function generateExtTaskId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}