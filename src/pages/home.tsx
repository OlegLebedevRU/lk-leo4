import { ProCard, ProDescriptions } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Devicelist from './DeviceList';
import EventList from './EventsList';
import DetailList from './TasksList';
import TagList from './DeviceTags';
import DeviceConsoleTab from '../features/devices/components/DeviceConsoleTab';
import { useDeviceInfo } from '../hooks/useDevices';
import type { DeviceApiResponse, DeviceId } from '../features/devices/types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type TabKey = 'context' | 'tasks' | 'events' | 'tags' | 'console';

type SelectedDevice = {
  deviceId: DeviceId;
  cmd?: string;
};

const TAB_ITEMS = [
  { label: 'Контекст', key: 'context' },
  { label: 'Команды/задачи', key: 'tasks' },
  { label: 'Журнал событий', key: 'events' },
  { label: 'Теги', key: 'tags' },
  { label: 'Консоль', key: 'console' },
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
  const [activeTab, setActiveTab] = useState<TabKey>('context');
  const eventsRefreshFnRef = useRef<(() => void) | null>(null);

  // Используем React Query хук для получения информации об устройстве
  const { data: deviceInfo, isLoading, error, refetch } = useDeviceInfo(selectedDevice.deviceId);

  // Функция для регистрации функции обновления событий
  const setEventsRefreshFn = useCallback((fn: () => void) => {
    eventsRefreshFnRef.current = fn;
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key as TabKey);
  };

  // Interval для автообновления (1 минута)
  const AUTOREFRESH_INTERVAL = 60000;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Функция-обёртка для вызова обновления событий
  const handleEventsRefresh = useCallback(() => {
    if (eventsRefreshFnRef.current) {
      eventsRefreshFnRef.current();
    }
  }, []);

  // Очистка интервала при размонтировании
  const clearAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Запускаем interval когда eventsRefreshFn становится доступным
  // Останавливаем автообновление когда вкладка не активна
  useEffect(() => {
    if (!eventsRefreshFnRef.current) return;

    // Функция для проверки необходимости автообновления
    const shouldRefresh = () => {
      // Не обновляем если вкладка не активна
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return false;
      }
      return true;
    };

    const runAutoRefresh = () => {
      if (shouldRefresh()) {
        eventsRefreshFnRef.current?.();
      }
    };

    // Запускаем интервал
    intervalRef.current = setInterval(runAutoRefresh, AUTOREFRESH_INTERVAL);

    // Обработчик visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearAutoRefresh();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearAutoRefresh]);

  const handleDeviceChange = (deviceId: DeviceId, cmd?: string) => {
    setSelectedDevice({ deviceId, cmd });
    setActiveTab('context');
  };

  const renderContextTab = () => {
    let content: string | DeviceApiResponse | null = null;

    if (isLoading) {
      content = 'Загрузка сведений об устройстве...';
    } else if (error) {
      content = 'Не удалось загрузить сведения об устройстве';
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
        styles={{ body: { overflow: 'hidden' } }}
      >
        <ProDescriptions layout="vertical">
          <ProDescriptions.Item>
    <div style={{ position: 'relative' }}>
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
    const deviceSn = deviceInfo?.[0]?.sn;
    const deviceApp = deviceInfo?.[0]?.device_tags?.find((t) => t.tag === 'app')?.value;

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
      case 'console':
        return (
          <div style={{ flex: 1, minHeight: 0 }}>
            <DeviceConsoleTab sn={deviceSn} app={deviceApp} />
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
      <ProCard colSpan={activeTab === 'console' ? '30%' : '50%'} className="device-list-card">
        <Devicelist
          onChange={handleDeviceChange}
          onRefresh={() => refetch?.()}
          onAfterRefresh={handleEventsRefresh}
          device_id={selectedDevice.deviceId}
        />
      </ProCard>
      <ProCard
        title={`Устройство: ${selectedDevice.deviceId}`}
        variant="outlined"
        boxShadow
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          },
        }}
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={TAB_ITEMS} />
        {renderTabContent()}
      </ProCard>
    </ProCard>
  );
};

export default Monitoring;