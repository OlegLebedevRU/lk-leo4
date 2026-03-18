// src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, fetchTaskDetail, createTask } from '../features/tasks/api/tasks';
import type { NewDeviceTask } from '../features/tasks/types';

// Query keys
export const tasksKeys = {
  all: ['tasks'] as const,
  lists: () => [...tasksKeys.all, 'list'] as const,
  list: (deviceId: string) => [...tasksKeys.lists(), { deviceId }] as const,
  details: () => [...tasksKeys.all, 'detail'] as const,
  detail: (taskId: string) => [...tasksKeys.details(), taskId] as const,
};

// Хук для получения списка задач устройства
export function useTasks(deviceId: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: tasksKeys.list(deviceId),
    queryFn: () => fetchTasks(deviceId),
    enabled: !!deviceId,
    staleTime: 1000 * 30,
    refetchInterval: options?.refetchInterval,
  });
}

// Хук для получения детали задачи
export function useTaskDetail(taskId: string) {
  return useQuery({
    queryKey: tasksKeys.detail(taskId),
    queryFn: () => fetchTaskDetail(taskId),
    enabled: !!taskId,
  });
}

// Хук для создания задачи
export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (task: NewDeviceTask) => createTask(task),
    onSuccess: () => {
      // Инвалидируем все списки задач после создания
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
    },
  });
}

// Хук для получения результата задачи
export function useGetTaskResult() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taskId: string) => fetchTaskDetail(taskId),
    onSuccess: (_, taskId) => {
      // Инвалидируем кэш детали задачи для обновления
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(taskId) });
    },
  });
}
