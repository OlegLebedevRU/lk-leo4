// src/pages/DeviceList.tsx
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import { Badge, Button, Input, Space, Tag, Alert } from 'antd';
import { useState } from 'react';
import { fetchDevices } from '../features/devices/api/devices';
import { mapDevicesToListItems } from '../features/devices/domain/deviceMapping';
import { STATUS_ENUM, type DeviceListItem } from '../features/devices/types';
import { setApiKey, getApiKey } from '../common/httpPrivate';

type DeviceListProps = {
  device_id: string;
  onChange: (id: string, cmd?: string) => void;
};

const DeviceList: React.FC<DeviceListProps> = ({ onChange }) => {
  const valueEnum = STATUS_ENUM;

  // ✅ Ленивая инициализация — нет нужды в useEffect!
  const [apiKey, setLocalKey] = useState<string>(() => getApiKey());
  const [error, setError] = useState<string | null>(null);

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
  const columns: ProColumns<DeviceListItem>[] = [
    {
      title: '№ (Связь)',
      key: 'device_id',
      dataIndex: 'device_id',
      width: '25%',
      render: (_, item) => (
        <Space>
          <Tag color={item.status === valueEnum[0] ? 'green' : 'red'}>
            <Badge
              style={{ width: '8ch', fontWeight: 'bold' }}
              status={item.status}
              text={item.device_id}
              title="Состояние связи"
            />
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Серийный номер',
      key: 'sn',
      dataIndex: 'sn',
      width: '35%',
      render: (_, item) => (
        <Tag color="blue">{item.sn}</Tag>
      ),
    },
    {
      title: 'Описание',
      key: 'name',
      dataIndex: 'name',
      width: '40%',
      ellipsis: true,
    },
  ];

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

      <ProTable<DeviceListItem>
        headerTitle="Список устройств"
        columns={columns}
        request={async () => {
          try {
            const devices = await fetchDevices();
            const deviceItems: DeviceListItem[] = mapDevicesToListItems(devices);
            return { data: deviceItems, success: true };
          } catch (error: unknown) {
                let message = 'Ошибка загрузки устройств';

                if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { data?: { message?: string } } };
                    message = axiosError.response?.data?.message || message;
                } else if (error instanceof Error) {
                    message = error.message;
                }

                return {
                    data: [],
                    success: false,
                    errorMessage: message,
                };
                }
        }}
        rowKey="device_id"
        search={false}
        pagination={{
          pageSize: 20,
          showSizeChanger: false,
        }}
        options={{ reload: true }}
        onRow={(record) => ({
          onClick: () => {
            if (record.device_id) {
              onChange(record.device_id, record.cmds);
            }
          },
        })}
      />
    </div>
  );
};

export default DeviceList;