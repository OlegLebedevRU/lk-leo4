// src/features/tasks/types.ts

// Тип для строки таблицы
export type TaskListItem = {
  created_at: string;
  method_code: number;
  priority: number;
  ttl_minutes: number;
  status: number;
  task_id: string;
};

// Тип для детального ответа (с header)
export type ApiDeviceTaskResponse = {
  id: string;
  created_at: number | string;
  status: number;
  header?: {
    ext_task_id: string;
    method_code: number;
    priority: number;
    ttl: number;
  };
  results?: Array<{
    ext_id: number;
    id: number;
    status_code: number;
    result: Record<string, unknown>;
  }>;
};

// Тип для полной информации о задаче
export type FullTaskDetail = {
  id: string;
  created_at: string;
  status: number;
  ext_task_id: string;
  method_code: number;
  priority: number;
  ttl_minutes: number;
  result?: Record<string, unknown>;
  allResults?: Array<{
    ext_id: number;
    id: number;
    status_code: number;
    result: Record<string, unknown>;
  }>;
};

// Типы для создания задачи
export type DeviceTaskPayload = Record<string, unknown> & {
  dt: Array<Record<string, unknown>>;
};

export type NewDeviceTask = {
  ext_task_id: string;
  device_id: number;
  method_code: number;
  priority: number;
  ttl: number;
  payload?: DeviceTaskPayload;
};

export type NewDeviceTaskFormValues = {
  ext_task_id: string;
  device_id: number;
  method_code: number;
  priority: number;
  ttl: number;
  dt: string; // JSON string of array
};