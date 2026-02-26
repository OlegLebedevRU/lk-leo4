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

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    fetchDevices()
      .then((devices) => {
        if (cancelled) return;
        setData(mapDevicesToListItems(devices));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [version]);

  return { data, isLoading, error, reload };
}

