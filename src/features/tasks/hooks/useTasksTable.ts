// src/features/tasks/hooks/useTasksTable.ts
import { useCallback, useEffect, useState } from 'react';
import type { TaskListItem } from '../types';
import { fetchTasks } from '../api/tasks';
import { mapTasksToListItems } from '../domain/taskMapping';

type UseTasksTableResult = {
  data: TaskListItem[];
  isLoading: boolean;
  error: unknown;
  reload: () => void;
  total: number;
};

export function useTasksTable(deviceId: string): UseTasksTableResult {
  const [data, setData] = useState<TaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);
  const [total, setTotal] = useState(0);

  const reload = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchTasks(deviceId);
      setData(mapTasksToListItems(response.items));
      setTotal(response.total);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, version]);

  return { data, isLoading, error, reload, total };
}