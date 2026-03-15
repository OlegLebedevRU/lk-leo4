// src/features/tasks/api/tasks.ts
import { axiosPrivate } from '../../../common/httpPrivate';
import type { ApiDeviceTaskResponse, NewDeviceTask } from '../types';

export async function fetchTasks(deviceId: string, params?: { page?: number; size?: number }): Promise<{
  items: Array<{
    id: string;
    created_at: string;
    status: number;
    method_code: number;
    priority: number;
    ttl: number;
  }>;
  total: number;
}> {
  const response = await axiosPrivate.get<{
    items: Array<{
      id: string;
      created_at: string;
      status: number;
      method_code: number;
      priority: number;
      ttl: number;
    }>;
    total: number;
  }>('/device-tasks/', {
    params: {
      device_id: deviceId,
      ...params,
    },
  });
  return response.data;
}

export async function fetchTaskDetail(taskId: string): Promise<ApiDeviceTaskResponse> {
  const response = await axiosPrivate.get<ApiDeviceTaskResponse>(`/device-tasks/${taskId}`);
  return response.data;
}

export async function createTask(task: NewDeviceTask): Promise<{ id: string | number }> {
  const response = await axiosPrivate.post('/device-tasks/', task);
  return response.data;
}

export const tasksQueryKey = (deviceId: string) => ['tasks', deviceId] as const;

export function createTasksQueryOptions(deviceId: string) {
  return {
    queryKey: tasksQueryKey(deviceId),
    queryFn: () => fetchTasks(deviceId),
  };
}