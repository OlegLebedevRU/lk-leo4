// src/features/tasks/domain/taskCreation.ts
import { createTask } from '../api/tasks';
import { formatJson } from './taskMapping';
import { getMethodCodeConfig } from './methodCodes';
import type { NewDeviceTaskFormValues, DeviceTaskPayload } from '../types';

export { formatJson };

/**
 * Формирует dt массив из динамических полей формы
 */
export function buildDtFromFormValues(values: NewDeviceTaskFormValues): unknown[] {
  const methodConfig = getMethodCodeConfig(values.method_code);
  if (methodConfig) {
    // Проверяем, поддерживает ли метод множественные объекты и есть ли они
    if (methodConfig.supportsMultiple && methodConfig.buildDtMultiple && values.dt_items && values.dt_items.length > 0) {
      return methodConfig.buildDtMultiple(values.dt_items);
    }
    return methodConfig.buildDt(values);
  }
  // Если конфиг не найден, пробуем распарсить dt как JSON (для обратной совместимости)
  return parseDt(values.dt);
}

export function parseDt(dtText: string | undefined): unknown[] {
  const raw = dtText?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('dt должен быть массивом');
    }
    return parsed;
  } catch {
    throw new Error('dt должен быть валидным JSON-массивом');
  }
}

export function toNewDeviceTaskRequest(values: NewDeviceTaskFormValues): import('../types').NewDeviceTask {
  const dt = buildDtFromFormValues(values) as import('../types').DeviceTaskPayload['dt'];
  const payload: DeviceTaskPayload = { dt };
  return {
    ...values,
    payload,
  };
}

export function buildPacketPreview(values: NewDeviceTaskFormValues): string {
  try {
    const dt = buildDtFromFormValues(values) as import('../types').DeviceTaskPayload['dt'];
    const task: import('../types').NewDeviceTask = {
      ext_task_id: values.ext_task_id,
      device_id: values.device_id,
      method_code: values.method_code,
      priority: values.priority,
      ttl: values.ttl,
      payload: { dt },
    };
    return JSON.stringify(task, null, 2);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return JSON.stringify(
      {
        ...values,
        error: errorMessage,
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

export async function submitTask(values: NewDeviceTaskFormValues): Promise<{ id: string | number }> {
  const task = toNewDeviceTaskRequest(values);
  return await createTask(task);
}