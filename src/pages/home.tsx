//import '@ant-design/v5-patch-for-react-19';
import { ProCard, ProDescriptions } from '@ant-design/pro-components';
import { ConfigProvider, Tabs, theme } from 'antd';
import type { TabsProps } from 'antd';
import React, { useState } from 'react';
import Devicelist from './DeviceList';
import EventList from './EventsList';
import DetailList from './TasksList';
import ruRU from 'antd/locale/ru_RU';
import TagList from './DeviceTags';
import { axiosPrivate } from '../common/httpPrivate';
import type { DeviceApiResponse, DeviceId } from '../features/devices/types';

type TabKey = 'context' | 'tasks' | 'events' | 'tags';

type SelectedDevice = {
    deviceId: DeviceId;
    cmd?: string;
};

type DeviceInfo = DeviceApiResponse[];

const TAB_ITEMS: TabsProps['items'] = [
    { label: 'Контекст', key: 'context' },
    { label: 'Команды/задачи', key: 'tasks' },
    { label: 'Журнал событий', key: 'events' },
    { label: 'Теги', key: 'tags' },
];

const DEFAULT_DEVICE_ID: DeviceId = '0';

// @description Home page component
const Monitoring: React.FC = () => {
    const [selectedDevice, setSelectedDevice] = useState<SelectedDevice>({ deviceId: DEFAULT_DEVICE_ID, cmd: '--' });
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
            const response = await axiosPrivate.get<DeviceInfo>('/api/v1/devices/', {
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
                    <ProDescriptions.Item
                        fieldProps={{
                            style: {
                                fontSize: 10,
                                color: '#dae7f0ff',
                                backgroundColor: '#0f0e0eff',
                            },
                        }}
                        valueType="jsonCode"
                    >
                        {renderedContent}
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
                            maxHeight: '100%',
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
        <ConfigProvider locale={ruRU} theme={{ algorithm: theme.compactAlgorithm }}>
            <ProCard
                split="vertical"
                style={{ left: 0, marginBlockStart: 0, minHeight: 'calc(100vh - 40px)' }}
            >
                <ProCard colSpan="50%" style={{ left: 0, marginBlockStart: 0 }}>
                    <Devicelist
                        onChange={handleDeviceChange}
                        device_id={selectedDevice.deviceId}
                    />
                </ProCard>
                <ProCard
                    title={`Устройство: ${selectedDevice.deviceId}`}
                    style={{ bottom: 0, left: 0, height: '100%' }}
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
        </ConfigProvider>
    );
};

export default Monitoring;
