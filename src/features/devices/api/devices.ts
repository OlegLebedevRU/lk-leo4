import { axiosPrivate } from '../../../common/httpPrivate';
import type { DeviceApiResponse } from '../types';

export async function fetchDevices(): Promise<DeviceApiResponse[]> {
  const response = await axiosPrivate.get<DeviceApiResponse[]>('/devices/');
  return response.data;
}

export const devicesQueryKey = ['devices'] as const;

export function createDevicesQueryOptions() {
  return {
    queryKey: devicesQueryKey,
    queryFn: fetchDevices,
  };
}

