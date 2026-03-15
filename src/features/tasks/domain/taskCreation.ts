// src/features/tasks/domain/taskCreation.ts
import { createTask } from '../api/tasks';
import { formatJson } from './taskMapping';
import type { NewDeviceTaskFormValues, DeviceTaskPayload } from '../types';

export { formatJson };

export function parseDt(dtText: string | undefined): any[] {
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
  const { dt: dtText, ...rest } = values;
  const dt = parseDt(dtText);
  const payload: DeviceTaskPayload = { dt };
  return {
    ...rest,
    payload,
  };
}

export function buildPacketPreview(values: NewDeviceTaskFormValues): string {
  try {
    const dt = parseDt(values.dt);
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