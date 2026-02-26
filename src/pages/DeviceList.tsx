import { CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import { Badge, Space, Tag } from 'antd';
import { fetchDevices } from '../features/devices/api/devices';
import { mapDevicesToListItems } from '../features/devices/domain/deviceMapping';
import { STATUS_ENUM, type DeviceListItem } from '../features/devices/types';


type DeviceListProps = {
    device_id: string;
    onChange: (id: string, cmd?:string) => void;
   // success:boolean;
};

const Devicelist: React.FC<DeviceListProps> = (props) => {
    const { onChange } = props;
    const valueEnum = STATUS_ENUM;

    const columns: ProColumns<DeviceListItem>[] = [
        {
            title: '№ (Связь)',
            key: 'device_id',
            dataIndex: 'device_id',

            render: (_, item) => {
                return (

                    <Space  >
                        
                        <Tag color={item.status == valueEnum[0] ? "green" : "red"}  
                            // icon={item.status == valueEnum[0] ? <SyncOutlined spin /> : <CloseCircleOutlined />}
                            >
                            <Badge style={{ width: '8ch', font: 'bold' }} status={item.status} text={item.device_id}
                            title="Состояние связи" 
                            />
                        </Tag>
                    </Space>
                );
            },
        },
        {
            title: 'WS Gate',
            key:'active_ws',
            dataIndex:'active_ws',
            render: (_, item) => {
                            return (

                                <Space  >
                                    <Tag color={item.active_ws ==valueEnum[0] ? "rgba(12, 133, 93, 1)" : "rgba(223, 220, 220, 1)"}
                                        icon={item.active_ws == valueEnum[0] ? <SyncOutlined spin /> : <CloseCircleOutlined />}
                                        >
                                        <Badge style={{ width: '2ch', font: 'bold' }} status={item.active_ws} 
                                        title="Состояние сокета"
                                        />
                                    </Tag>
                                </Space>
                            );
                        },

        },
 {
            title: 'Серийный номер',
            key: 'sn',
            dataIndex: 'sn',

            render: (_, item) => {
                return (
                        <Tag color="blue">{item.sn}</Tag>
                );
            },
        },
        {
            title: 'Описание',
            key: 'name',
            width: '50%',
            dataIndex: 'name',

        },
        {
            title: 'Быстрый доступ',
            key: 'cmds',
            width: '25%',
            dataIndex: 'cmds',
            valueType:"option",
            render: (_text, record, _, action) => [
                <a
                key="editable"
                onClick={() => {
                    action?.reload();
                }}
                >
                {record.cmds}
                </a>,]

        },

    ];
    return (
        <ProTable<DeviceListItem>
            headerTitle="Список устройств"
            columns={columns}
            request={async () => {
                const devices = await fetchDevices();
                const deviceItems: DeviceListItem[] = mapDevicesToListItems(devices);
                return { data: deviceItems, success:true }
            }}
            rowKey="device_id"
            toolbar={{
                search: {
                    onSearch: (value) => {
                        alert(value);
                    },
                },
            }}
            options={{reload:true}}
            pagination={{
                pageSize: 20,
                showSizeChanger: false,
            }}
            search={false}
            onRow={(record) => {
                return {
                    onClick: () => {
                        if (record.device_id) {
                            onChange(record.device_id, record.cmds);
                        }
                    },
                };
            }}
        />
    );
};

export default Devicelist