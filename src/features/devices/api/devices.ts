import { axiosPrivate } from '../../../common/httpPrivate';
import type { DeviceApiResponse, DeviceId } from '../types';

export async function fetchDevices(): Promise<DeviceApiResponse[]> {
  const response = await axiosPrivate.get<DeviceApiResponse[]>('/devices/');
  return response.data;
}

// Получение информации об одном устройстве по ID
export async function fetchDeviceById(deviceId: DeviceId): Promise<DeviceApiResponse[]> {
  const response = await axiosPrivate.get<DeviceApiResponse[]>('/devices/', {
    params: { device_id: deviceId },
  });
  return response.data;
}

export const devicesQueryKey = ['devices'] as const;

export function createDevicesQueryOptions() {
  return {
    queryKey: devicesQueryKey,
    queryFn: fetchDevices,
  };
}

export function createDeviceByIdQueryOptions(deviceId: DeviceId) {
  return {
    queryKey: [...devicesQueryKey, 'byId', deviceId] as const,
    queryFn: () => fetchDeviceById(deviceId),
    enabled: !!deviceId,
  };
}

