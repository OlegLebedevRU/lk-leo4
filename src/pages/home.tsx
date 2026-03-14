import { ProCard, ProDescriptions } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import React, { useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);

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
        style={{ width: '100%', maxHeight: '70vh' }}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <ProDescriptions layout="vertical">
          <ProDescriptions.Item>
  <SyntaxHighlighter
    language="json"
    style={vscDarkPlus}
    customStyle={{
      margin: 0,
      fontSize: '10px', // Совпадает с вашим fieldProps.fontSize
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      color: '#dae7f0ff', // Совпадает с вашим fieldProps.color
      background: '#0f0e0eff', // Совпадает с вашим fieldProps.backgroundColor
      padding: '8px', // Небольшой отступ для читаемости
      borderRadius: '4px',
      overflow: 'auto',
      maxHeight: '60vh', // Ограничение высоты, чтобы не выходило за пределы карточки
    }}
  >
    {renderedContent}
  </SyntaxHighlighter>
</ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>
    );
  };

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
        return (
          <div style={{ flex: 1 }}>
            <EventList device_id={selectedDevice.deviceId} />
          </div>
        );
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
    <ProCard split="vertical" style={{ minHeight: 'calc(100vh - 40px)' }}>
      <ProCard colSpan="50%">
        <Devicelist
          onChange={handleDeviceChange}
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