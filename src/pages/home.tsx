import { ProCard, ProDescriptions } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Devicelist from './DeviceList';
import EventList from './EventsList';
import DetailList from './TasksList';
import TagList from './DeviceTags';
import { axiosPrivate } from '../common/httpPrivate';
import type { DeviceApiResponse, DeviceId } from '../features/devices/types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
type TabKey = 'context' | 'tasks' | 'events' | 'tags';

type SelectedDevice = {
  deviceId: DeviceId;
  cmd?: string;
};

type DeviceInfo = DeviceApiResponse[];

const TAB_ITEMS = [
  { label: 'Контекст', key: 'context' },
  { label: 'Команды/задачи', key: 'tasks' },
  { label: 'Журнал событий', key: 'events' },
  { label: 'Теги', key: 'tags' },
];

const DEFAULT_DEVICE_ID: DeviceId = '0';

/**
 * Главная страница мониторинга устройств
 */
const Monitoring: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<SelectedDevice>({
    deviceId: DEFAULT_DEVICE_ID,
    cmd: '--',
  });
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('context');
  const [isLoading, setIsLoading] = useState(false);
  const [isSoftLoading, setIsSoftLoading] = useState(false); // Для мягкой загрузки без моргания
  const [error, setError] = useState<string | null>(null);
  const eventsRefreshFnRef = useRef<(() => void) | null>(null);

  // Функция для регистрации функции обновления событий
  const setEventsRefreshFn = useCallback((fn: () => void) => {
    console.log('[home] setEventsRefreshFn called');
    eventsRefreshFnRef.current = fn;
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key as TabKey);
  };

  const loadDeviceInfo = async (deviceId: DeviceId) => {
    setIsLoading(true);
    setError(null);
    setDeviceInfo(null);

    try {
      const response = await axiosPrivate.get<DeviceInfo>('/devices/', {
        params: { device_id: deviceId },
      });
      setDeviceInfo(response.data);
    } catch (e) {
      console.error('Failed to load device info', e);
      setError('Не удалось загрузить сведения об устройстве');
    } finally {
      setIsLoading(false);
    }
  };

  // Мягкая загрузка (для автообновления без моргания)
  const softRefreshDeviceInfo = async (deviceId: DeviceId) => {
    setIsSoftLoading(true);
    try {
      const response = await axiosPrivate.get<DeviceInfo>('/devices/', {
        params: { device_id: deviceId },
      });
      setDeviceInfo(response.data);
    } catch (e) {
      console.error('Failed to refresh device info', e);
      // Не показываем ошибку при фоновом обновлении
    } finally {
      setIsSoftLoading(false);
    }
  };

  // Interval для автообновления (1 минута)
  const AUTOREFRESH_INTERVAL = 60000;

  // Функция-обёртка для вызова обновления событий
  // Всегда вызывает eventsRefreshFn если он доступен
  const handleEventsRefresh = useCallback(() => {
    console.log('[home] handleEventsRefresh called, eventsRefreshFn available:', !!eventsRefreshFnRef.current);
    if (eventsRefreshFnRef.current) {
      eventsRefreshFnRef.current();
    }
  }, []);

  // Запускаем interval когда eventsRefreshFn становится доступным
  useEffect(() => {
    if (!eventsRefreshFnRef.current) return;

    const interval = setInterval(() => {
      console.log('[home] Auto-refresh EventsList');
      eventsRefreshFnRef.current?.();
    }, AUTOREFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleDeviceChange = (deviceId: DeviceId, cmd?: string) => {
    setSelectedDevice({ deviceId, cmd });
    setActiveTab('context');
    void loadDeviceInfo(deviceId);
  };

  const renderContextTab = () => {
    let content: string | DeviceApiResponse | null = null;

    if (isLoading) {
      content = 'Загрузка сведений об устройстве...';
    } else if (error) {
      content = error;
    } else if (!deviceInfo) {
      content = 'Выберите устройство';
    } else if (deviceInfo.length === 0) {
      content = 'Нет данных по устройству';
    } else {
      content = deviceInfo[0];
    }

    const renderedContent =
      typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    return (
      <ProCard
        title="Сведения об устройстве:"
        className="device-context-card"
        style={{ width: '100%' }}
        bodyStyle={{ overflow: 'hidden' }}
      >
        <ProDescriptions layout="vertical">
          <ProDescriptions.Item label={isSoftLoading ? <span>Обновление <span style={{ opacity: 0.5 }}>(фоново)</span></span> : undefined}>
    <div style={{ position: 'relative' }}>
      {isSoftLoading && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.7)',
            zIndex: 1
          }}
        >
          <span style={{ 
            background: 'rgba(0,0,0,0.6)', 
            color: '#fff', 
            padding: '4px 12px', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            Обновление...
          </span>
        </div>
      )}
      <SyntaxHighlighter
        language="json"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          fontSize: '10px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          color: '#dae7f0ff',
          background: '#0f0e0eff',
          padding: '8px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: 'calc(70vh - 60px)',
        }}
      >
        {renderedContent}
      </SyntaxHighlighter>
    </div>
</ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>
    );
  };

  // EventList рендерится всегда (в скрытом виде), чтобы функция обновления была доступна
  const renderEventsList = () => (
    <div style={{ display: activeTab === 'events' ? 'block' : 'none', flex: 1 }}>
      <EventList 
        device_id={selectedDevice.deviceId} 
        onRefresh={setEventsRefreshFn}
      />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'context':
        return (
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'stretch',
              overflow: 'hidden',
            }}
          >
            {renderContextTab()}
          </div>
        );
      case 'tasks':
        return (
          <div style={{ flex: 1 }}>
            <DetailList device_id={selectedDevice.deviceId} />
          </div>
        );
      case 'events':
        return renderEventsList();
      case 'tags':
        return (
          <div style={{ flex: 1 }}>
            <TagList device_id={selectedDevice.deviceId} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ProCard 
      split="vertical" 
      className="monitoring-card"
      style={{ minHeight: 'calc(100vh - 40px)' }}
    >
      <ProCard colSpan="50%" className="device-list-card">
        <Devicelist
          onChange={handleDeviceChange}
          onRefresh={() => softRefreshDeviceInfo(selectedDevice.deviceId)}
          onAfterRefresh={handleEventsRefresh}
          device_id={selectedDevice.deviceId}
        />
      </ProCard>
      <ProCard
        title={`Устройство: ${selectedDevice.deviceId}`}
        bordered
        boxShadow
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={TAB_ITEMS} />
        {renderTabContent()}
      </ProCard>
    </ProCard>
  );
};

export default Monitoring;