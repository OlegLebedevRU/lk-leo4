// src/features/tasks/hooks/useTaskDetail.ts
import { useCallback, useEffect, useState } from 'react';
import type { FullTaskDetail } from '../types';
import { fetchTaskDetail } from '../api/tasks';
import { mapApiResponseToFullTaskDetail } from '../domain/taskMapping';

type UseTaskDetailResult = {
  detail: FullTaskDetail | null;
  isLoading: boolean;
  error: unknown;
  loadDetail: (poll?: boolean) => void;
};

export function useTaskDetail(taskId: string): UseTaskDetailResult {
  const [detail, setDetail] = useState<FullTaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const loadDetail = useCallback(async (poll = false) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTaskDetail(taskId);
      const mappedDetail = mapApiResponseToFullTaskDetail(data);
      setDetail(mappedDetail);

      // Автообновление, если статус ≠ 3
      if (data.status === 3 || !poll) return;

      const interval = setInterval(async () => {
        try {
          const pollData = await fetchTaskDetail(taskId);
          const updatedDetail = mapApiResponseToFullTaskDetail(pollData);
          setDetail(updatedDetail);

          if (pollData.status === 3) {
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Polling failed:', err);
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    } catch (err) {
      console.error('Failed to load task detail:', err);
      setError(err);
      setDetail({
        id: taskId,
        created_at: '—',
        status: -1,
        ext_task_id: '—',
        method_code: -1,
        priority: 0,
        ttl_minutes: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [taskId, isLoading]);

  useEffect(() => {
    if (taskId) {
      loadDetail();
    }
  }, [taskId, loadDetail]);

  return { detail, isLoading, error, loadDetail };
}