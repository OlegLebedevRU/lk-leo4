// src/hooks/useEvents.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEvents } from '../features/events/api/events';
import { mapEventsToListItems } from '../features/events/domain/eventMapping';

// Query keys
export const eventsKeys = {
  all: ['events'] as const,
  lists: () => [...eventsKeys.all, 'list'] as const,
  list: (deviceId: string) => [...eventsKeys.lists(), { deviceId }] as const,
};

// Хук для получения списка событий устройства
export function useEvents(deviceId: string, options?: {
  page?: number;
  size?: number;
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { page = 1, size = 10, enabled = true, refetchInterval } = options || {};

  return useQuery({
    queryKey: eventsKeys.list(deviceId),
    queryFn: async () => {
      const response = await fetchEvents(deviceId, { page, size });
      return {
        items: mapEventsToListItems(response.items),
        total: response.total,
      };
    },
    enabled: !!deviceId && enabled,
    staleTime: 1000 * 30, // 30 секунд
    refetchInterval, // Автообновление (например, 60000 мс)
  });
}

// Хук для принудительного обновления событий
export function useInvalidateEvents() {
  const queryClient = useQueryClient();

  return (deviceId?: string) => {
    if (deviceId) {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list(deviceId) });
    } else {
      queryClient.invalidateQueries({ queryKey: eventsKeys.all });
    }
  };
}
