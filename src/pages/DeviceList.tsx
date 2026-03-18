// src/pages/DeviceList.tsx
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { Badge, Button, Space, Tag, Alert, Spin } from 'antd';
import { useState, useRef, useEffect } from 'react';
import { useDevices } from '../hooks/useDevices';
import { STATUS_ENUM, type DeviceListItem } from '../features/devices/types';
import { Tooltip } from 'antd';

type DeviceListProps = {
  device_id: string;
  onChange: (id: string, cmd?: string) => void;
  onRefresh?: () => void;
  onAfterRefresh?: () => void;
};

const DeviceList: React.FC<DeviceListProps> = ({ onChange, onRefresh, onAfterRefresh }) => {
  const valueEnum = STATUS_ENUM;
  const actionRef = useRef<ActionType>(null);

  // Состояние выбранного устройства
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Определение мобильного устройства
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 576;

  // Используем React Query хук
  const { data, isLoading, isError, error, refetch } = useDevices();

  // Вычисляем состояние ошибки из React Query
  const errorMessage = isError ? (error instanceof Error ? error.message : 'Ошибка загрузки устройств') : null;
  const hasApiError = isError;

  // Вызываем колбэки при успешной загрузке данных
  // Используем ref для отслеживания уже выполненных обновлений
  const lastRefreshTimeRef = useRef<number>(0);
  const prevDataRef = useRef<DeviceListItem[] | undefined>(undefined);
  
  useEffect(() => {
    // Вызываем onRefresh и onAfterRefresh только при первом加载или при реальном изменении данных
    // Защита от слишком частых вызовов (минимум 30 секунд между вызовами)
    const now = Date.now();
    const isDataChanged = prevDataRef.current !== data;
    
    if (data && !isLoading && isDataChanged && now - lastRefreshTimeRef.current > 30000) {
      lastRefreshTimeRef.current = now;
      prevDataRef.current = data;
      if (onRefresh) onRefresh();
      if (onAfterRefresh) onAfterRefresh();
    } else if (data && !isLoading && !prevDataRef.current) {
      // Первая загрузка - вызываем колбэки
      prevDataRef.current = data;
      if (onRefresh) onRefresh();
      if (onAfterRefresh) onAfterRefresh();
    }
  }, [data, isLoading, onRefresh, onAfterRefresh]);

  // Функция для получения цвета иконки
  const getBadgeStatus = (status: string | undefined, isApiError: boolean): 'success' | 'error' | 'default' => {
    const isGreen = status === valueEnum[0];
    
    if (isApiError && isGreen) {
      return 'default';
    }
    
    return isGreen ? 'success' : 'error';
  };

  // Функция для определения стиля Tag
  const getTagStyle = (status: string | undefined, isApiError: boolean) => {
    const isGreen = status === valueEnum[0];
    
    if (isApiError && isGreen) {
      return {
        backgroundColor: '#f0f0f0',
        border: '1px solid #d9d9d9',
        color: '#8c8c8c'
      };
    }
    
    return {
      backgroundColor: isGreen ? '#f6ffed' : '#fff1f0',
      border: isGreen ? '1px solid #b7eb8f' : '#1px solid #ffccc7',
      color: isGreen ? '#389e0d' : '#cf1322'
    };
  };

  const columns: ProColumns<DeviceListItem>[] = [
    {
      title: '№ (Связь)',
      key: 'device_id',
      dataIndex: 'device_id',
      sorter: (a, b) => {
        const aId = Number(a.device_id) || 0;
        const bId = Number(b.device_id) || 0;
        return aId - bId;
      },
      defaultSortOrder: 'ascend',
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
                    fontWeight: 'normal',
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
      title: 'SN',
      key: 'sn',
      dataIndex: 'sn',
      render: (_, item) => {
        const sn = String(item.sn || '');
        const displaySn = sn.length > 10 ? sn.substring(0, 10) + '...' : sn;
        return (
          <Tooltip title={<span style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(sn)}>{sn} (нажмите для копирования)</span>}>
            <Tag color="blue">{displaySn}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'APP',
      key: 'app',
      dataIndex: 'app',
      ellipsis: true,
    },
    {
      title: 'Описание',
      key: 'name',
      dataIndex: 'name',
      ellipsis: true,
    },
  ];

  // Показываем загрузку при первом рендере
  if (isLoading && !data) {
    return (
      <div style={{ padding: isMobile ? '8px' : '16px', textAlign: 'center', paddingTop: 40 }}>
        <Spin size="large" />
        <div style={{ marginTop: 8 }}>Загрузка устройств...</div>
      </div>
    );
  }

  return (
    <div className="device-list-container" style={{ padding: isMobile ? '8px' : '16px' }}>
      {/* Показываем ошибку API если есть */}
      {hasApiError && errorMessage && (
        <Alert 
          message="Ошибка связи с API" 
          description={errorMessage + '. Данные могут быть устаревшими.'} 
          type="warning" 
          showIcon 
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" onClick={() => refetch()}>
              Повторить
            </Button>
          }
        />
      )}

      <ProTable<DeviceListItem>
        actionRef={actionRef}
        headerTitle="Список устройств"
        columns={columns}
        // Используем данные из React Query
        dataSource={data || []}
        rowKey={(record) => String(record.device_id)}
        search={false}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: isMobile ? 10 : 20,
          showSizeChanger: false,
          disabled: hasApiError,
          total: data?.length || 0,
          showTotal: (total: number) => `Всего: ${total}`,
        }}
        options={isMobile ? false : { 
          reload: () => {
            refetch();
            return Promise.resolve();
          }
        }}
        toolbar={{
          actions: isMobile ? [
            <Button key="reload" type="text" size="small" onClick={() => refetch()}>
              ↻ Обновить
            </Button>
          ] : undefined,
        }}
        rowClassName={(record) => String(record.device_id) === selectedDeviceId ? 'device-row-selected' : ''}
        onRow={(record) => ({
          onClick: () => {
            if (record.device_id != null) {
              setSelectedDeviceId(String(record.device_id));
              onChange(String(record.device_id), record.cmds);
            }
          },
        })}
      />
    </div>
  );
};

export default DeviceList;
