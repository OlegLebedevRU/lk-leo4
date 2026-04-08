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
  // Динамические поля для dt в зависимости от method_code
  dt_cd?: string;       // Для method_code=16: ID карты/пинкод
  dt_cl?: number;       // Для method_code=16,51: номер слота/ячейки
  dt_mt?: number;       // Для method_code=20: номер команды
  dt_pin?: string;      // Для method_code=35: пинкод
  dt_values?: number[] | string; // Для method_code=47: массив слотов
  dt_url?: string;      // Для method_code=512: URL прошивки
  dt_sha256?: string;   // Для method_code=512: SHA256
  dt_chunk_size?: number; // Для method_code=512: размер чанка
  // Для method_code=16 с множественными объектами
  dt_items?: Array<{ dt_cd: string; dt_cl: number }> | Array<{ dt_ns: string; dt_k: string; dt_t: string; dt_v: string }>;
};