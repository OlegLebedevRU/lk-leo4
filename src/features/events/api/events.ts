// src/features/events/api/events.ts
import { axiosPrivate } from '../../../common/httpPrivate';
import type { DeviceEventApiResponse } from '../types';

export async function fetchEvents(deviceId: string, params?: { page?: number; size?: number; events_exclude?: number }): Promise<{ items: DeviceEventApiResponse[]; total: number }> {
  const response = await axiosPrivate.get<{ items: DeviceEventApiResponse[]; total: number }>('/device-events/', {
    params: {
      device_id: deviceId,
      events_exclude: 44,
      ...params,
    },
  });
  return response.data;
}

export const eventsQueryKey = (deviceId: string) => ['events', deviceId] as const;

export function createEventsQueryOptions(deviceId: string) {
  return {
    queryKey: eventsQueryKey(deviceId),
    queryFn: () => fetchEvents(deviceId),
  };
}