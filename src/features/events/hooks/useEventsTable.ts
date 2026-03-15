// src/features/events/hooks/useEventsTable.ts
import { useCallback, useEffect, useState } from 'react';
import type { EventListItem } from '../types';
import { fetchEvents } from '../api/events';
import { mapEventsToListItems } from '../domain/eventMapping';

type UseEventsTableResult = {
  data: EventListItem[];
  isLoading: boolean;
  error: unknown;
  reload: () => void;
  total: number;
};

export function useEventsTable(deviceId: string): UseEventsTableResult {
  const [data, setData] = useState<EventListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);
  const [total, setTotal] = useState(0);

  const reload = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchEvents(deviceId);
      setData(mapEventsToListItems(response.items));
      setTotal(response.total);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, version]);

  return { data, isLoading, error, reload, total };
}