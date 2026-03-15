// src/pages/DeviceList.tsx
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { Badge, Button, Input, Space, Tag, Alert } from 'antd';
import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchDevices } from '../features/devices/api/devices';
import { mapDevicesToListItems } from '../features/devices/domain/deviceMapping';
import { STATUS_ENUM, type DeviceListItem } from '../features/devices/types';
import { setApiKey, getApiKey } from '../common/httpPrivate';
import { Tooltip } from 'antd';

type DeviceListProps = {
  device_id: string;
  onChange: (id: string, cmd?: string) => void;
  onRefresh?: () => void;
  onAfterRefresh?: () => void;
};

// Расширяем тип для хранения времени последней загрузки
type DeviceWithBaseAge = DeviceListItem & {
  _baseAgeSeconds?: number;
};

const AUTOREFRESH_INTERVAL = 60000; // 1 минута

const DeviceList: React.FC<DeviceListProps> = ({ onChange, onRefresh, onAfterRefresh }) => {
  const valueEnum = STATUS_ENUM;
  const actionRef = useRef<ActionType>(null);
  const isInitialLoad = useRef(true);

  // ✅ Ленивая инициализация — нет нужды в useEffect!
  const [apiKey, setLocalKey] = useState<string>(() => getApiKey());
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для отслеживания потери связи с API
  const [hasApiError, setHasApiError] = useState<boolean>(false);
  const [lastKnownDevices, setLastKnownDevices] = useState<DeviceWithBaseAge[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [fetchTime, setFetchTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Обновляем текущее время каждую секунду для пересчета ageSeconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Автообновление списка устройств раз в 10 секунд на активном page
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      console.log('[DeviceList] Auto-refresh triggered, hasApiError:', hasApiError);
      // Вызываем обновление только если есть actionRef
      if (actionRef.current) {
        console.log('[DeviceList] Calling reload...');
        actionRef.current.reload?.();
      } else {
        console.log('[DeviceList] actionRef not ready yet');
      }
    }, AUTOREFRESH_INTERVAL);
    
    return () => clearInterval(autoRefreshInterval);
  }, [hasApiError]);

  // Вычисляем устройства с пересчитанным ageSeconds
  const devicesWithRecalculatedAge = useMemo(() => {
    if (fetchTime === 0) {
      return lastKnownDevices;
    }
    
    const secondsSinceFetch = Math.floor((currentTime - fetchTime) / 1000);
    
    return lastKnownDevices.map(device => ({
      ...device,
      ageSeconds: device._baseAgeSeconds !== undefined 
        ? device._baseAgeSeconds + secondsSinceFetch 
        : undefined
    }));
  }, [lastKnownDevices, currentTime, fetchTime]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalKey(e.target.value);
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      setError("API-ключ не может быть пустым");
      return;
    }
    setError(null);
    setApiKey(apiKey); // Сохраняем в localStorage
    window.location.reload(); // Чтобы новые запросы пошли с ключом
  };

  // Функция для получения цвета иконки
  const getBadgeStatus = (status: string | undefined, isApiError: boolean): 'success' | 'error' | 'default' => {
    const isGreen = status === valueEnum[0];
    
    if (isApiError && isGreen) {
      // Серый (default) для зеленых при потере связи
      return 'default';
    }
    
    return isGreen ? 'success' : 'error';
  };

  // Функция для определения стиля Tag
  const getTagStyle = (status: string | undefined, isApiError: boolean) => {
    const isGreen = status === valueEnum[0];
    
    if (isApiError && isGreen) {
      // Серый цвет для зеленых бейджей при потере связи
      return {
        backgroundColor: '#f0f0f0',
        border: '1px solid #d9d9d9',
        color: '#8c8c8c'
      };
    }
    
    // Оригинальные стили
    return {
      backgroundColor: isGreen ? '#f6ffed' : '#fff1f0',
      border: isGreen ? '1px solid #b7eb8f' : '1px solid #ffccc7',
      color: isGreen ? '#389e0d' : '#cf1322'
    };
  };

  const columns: ProColumns<DeviceListItem>[] = [
    {
    title: '№ (Связь)',
    key: 'device_id',
    dataIndex: 'device_id',
    render: (_, item) => {
      const isGreen = item.status === valueEnum[0];
      const tagStyle = getTagStyle(item.status, hasApiError);
      const textColor = hasApiError && isGreen ? '#8c8c8c' : '#000';
      
      return (
        <Space>
          <Tooltip
            title={
              item.ageSeconds !== undefined
                ? `Время с последнего обновления: ${Math.floor(item.ageSeconds / 60)} мин ${item.ageSeconds % 60} сек`
                : 'Нет данных'
            }
          >
            <Tag
              color={isGreen ? (hasApiError ? 'default' : 'green') : 'red'}
              style={{
                border: tagStyle.border,
                width: '14ch',
                backgroundColor: tagStyle.backgroundColor,
              }}
            >
              <Badge
                style={{
                  fontSize: '12px',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontWeight: 'bold',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                }}
                status={getBadgeStatus(item.status, hasApiError)}
                text={
                  item.device_id != null
                    ? <span style={{ color: textColor }}>{String(item.device_id)}</span>
                    : <span style={{ color: textColor }}>0</span>
                }
                title="Состояние связи"
              />
            </Tag>
          </Tooltip>
        </Space>
      );
    },
  },
    {
      title: 'Серийный номер',
      key: 'sn',
      dataIndex: 'sn',
      render: (_, item) => (
        <Tag color="blue">{item.sn}</Tag>
      ),
    },
    {
      title: 'Описание',
      key: 'name',
      dataIndex: 'name',
      ellipsis: true,
    },
  ];

  // Обработчик запроса данных
  const handleRequest = async () => {
    console.log('[DeviceList] handleRequest called, isInitialLoad:', isInitialLoad.current);
    
    try {
      const devices = await fetchDevices();
      const deviceItems: DeviceListItem[] = mapDevicesToListItems(devices);
      console.log('[DeviceList] Fetch successful, devices count:', deviceItems.length);
      
      // Сохраняем устройства с базовым временем age для пересчета
      const devicesWithBaseAge: DeviceWithBaseAge[] = deviceItems.map(item => ({
        ...item,
        _baseAgeSeconds: item.ageSeconds
      }));
      
      setLastKnownDevices(devicesWithBaseAge);
      setFetchTime(Date.now());
      setHasApiError(false);
      setErrorMessage(null);
      isInitialLoad.current = false;
      
      // Вызываем колбэк после успешного обновления
      if (onRefresh) {
        onRefresh();
      }
      
      // Вызываем дополнительный колбэк после обновления (для EventsList)
      // Вызываем ВСЕГДА, чтобы принудительно обновить события даже если не на вкладке events
      if (onAfterRefresh) {
        console.log('[DeviceList] Calling onAfterRefresh');
        onAfterRefresh();
      }
      
      return { data: deviceItems, success: true };
    } catch (error: unknown) {
      let message = 'Ошибка загрузки устройств';
      console.log('[DeviceList] Fetch error:', error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        message = axiosError.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      console.log('[DeviceList] Setting hasApiError to true, message:', message);
      
      // Устанавливаем флаг ошибки API
      setHasApiError(true);
      setErrorMessage(message);
      
      // Возвращаем последние известные данные с пересчитанным age
      const dataToReturn = devicesWithRecalculatedAge.length > 0 
        ? devicesWithRecalculatedAge 
        : lastKnownDevices;
      
      console.log('[DeviceList] Returning cached data, count:', dataToReturn.length);
      
      return {
        data: dataToReturn,
        success: false,
        errorMessage: message,
      };
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', padding: '12px', border: '1px solid #d9d9d9', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h3>Настройка доступа</h3>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Input.Password
            placeholder="Введите X-Api-Key"
            value={apiKey}
            onChange={handleApiKeyChange}
            size="large"
          />
          {error && <Alert message={error} type="error" showIcon />}
          <Button type="primary" onClick={saveApiKey}>
            Сохранить ключ
          </Button>
        </Space>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Ключ сохраняется в браузере. Используется для всех запросов.
        </div>
      </div>

      {/* Показываем ошибку API если есть */}
      {hasApiError && errorMessage && (
        <Alert 
          message="Ошибка связи с API" 
          description={errorMessage + '. Данные могут быть устаревшими.'} 
          type="warning" 
          showIcon 
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" onClick={() => actionRef.current?.reload()}>
              Повторить
            </Button>
          }
        />
      )}

      <ProTable<DeviceListItem>
        actionRef={actionRef}
        headerTitle="Список устройств"
        columns={columns}
        request={handleRequest}
        rowKey={(record) => String(record.device_id)}
        search={false}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 20,
          showSizeChanger: false,
          // Блокируем пагинацию при ошибке API
          disabled: hasApiError,
        }}
        options={{ reload: true }}
        onRow={(record) => ({
          onClick: () => {
            if (record.device_id != null) {
              onChange(String(record.device_id), record.cmds);
            }
          },
        })}
      />
    </div>
  );
};

export default DeviceList;
