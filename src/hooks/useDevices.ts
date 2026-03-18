// src/hooks/useDevices.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDevices, fetchDeviceById } from '../features/devices/api/devices';
import { mapDevicesToListItems } from '../features/devices/domain/deviceMapping';
import type { DeviceListItem, DeviceApiResponse, DeviceId } from '../features/devices/types';

// Query keys
export const devicesKeys = {
  all: ['devices'] as const,
  list: () => [...devicesKeys.all, 'list'] as const,
  detail: (deviceId: string) => [...devicesKeys.all, 'detail', deviceId] as const,
  byId: (deviceId: DeviceId) => [...devicesKeys.all, 'byId', deviceId] as const,
};

// Хук для получения списка устройств
export function useDevices() {
  return useQuery({
    queryKey: devicesKeys.list(),
    queryFn: async (): Promise<DeviceListItem[]> => {
      const devices = await fetchDevices();
      return mapDevicesToListItems(devices);
    },
    staleTime: 1000 * 30, // 30 секунд
    gcTime: 1000 * 60 * 5, // 5 минут
    refetchInterval: 1000 * 60, // 1 минута - автообновление
  });
}

// Хук для получения информации об устройстве по ID
export function useDeviceInfo(deviceId: DeviceId) {
  return useQuery({
    queryKey: devicesKeys.byId(deviceId),
    queryFn: async (): Promise<DeviceApiResponse[]> => {
      return fetchDeviceById(deviceId);
    },
    enabled: !!deviceId,
    staleTime: 1000 * 30, // 30 секунд
    gcTime: 1000 * 60 * 5, // 5 минут
  });
}

// Хук для принудительного обновления списка устройств
export function useInvalidateDevices() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: devicesKeys.all });
  };
}
