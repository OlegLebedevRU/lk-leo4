import { useCallback, useEffect, useState } from 'react';
import type { DeviceListItem } from '../types';
import { fetchDevices } from '../api/devices';
import { mapDevicesToListItems } from '../domain/deviceMapping';

type UseDevicesTableResult = {
  data: DeviceListItem[];
  isLoading: boolean;
  error: unknown;
  reload: () => void;
};

export function useDevicesTable(): UseDevicesTableResult {
  const [data, setData] = useState<DeviceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const devices = await fetchDevices();
      setData(mapDevicesToListItems(devices));
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices, version]);

  return { data, isLoading, error, reload };
}