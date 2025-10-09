import { CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import { Badge, Space, Tag, type BadgeProps } from 'antd';
import axios from 'axios';

type statusType = BadgeProps['status'];

const valueEnum: statusType[] = ['success', 'error', 'default'];
export type DeviceTag = {
    tag:string;
    value: string;
}
export type DeviceListItem = {
    device_id?: string;
    // tasks?: number | string;
    sn?: number | string;
    name?: number | string;
    status: statusType;
    tags?: DeviceTag[];
    cmds?: string;
};


type DeviceListProps = {
    device_id: string;
    onChange: (id: string, cmd?:string) => void;
   // success:boolean;
};

const Devicelist: React.FC<DeviceListProps> = (props) => {
    const { onChange } = props;

    const columns: ProColumns<DeviceListItem>[] = [
        {
            title: 'Номер',
            key: 'device_id',
            dataIndex: 'device_id',

            render: (_, item) => {
                return (

                    <Space size={0} >
                        <Tag color={item.status == valueEnum[0] ? "green" : "red"}
                            icon={item.status == valueEnum[0] ? <SyncOutlined spin /> : <CloseCircleOutlined />}>
                            <Badge style={{ width: '9ch', font: 'bold' }} status={item.status} text={item.device_id}
                            title="Состояние связи"
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
                //key="editable"
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
            request={async (params, sorter, filter) => {
                // -
                console.log(params, sorter, filter);

                const response = await axios.get('https://dev.leo4.ru/pages/api/v1/devices/', { withCredentials: true })
                //{ headers: { 'org-id': '0' } }
                //  { withCredentials: true }
                const r = response.data
                console.log(r)
                const deviceItems: DeviceListItem[] = 
                r.map((c: { connection: { last_checked_result: boolean; }; device_id: number; sn: string; device_tags: DeviceTag[] }) => {
                 let descr: string = "";
                 let cmds1: string = "";
                    c.device_tags.forEach((val, index) => {  
                    if (val)
                        if(val.tag=="1001" || val.tag=="name" || val.tag=="description") {
                            descr = descr.concat(" ", val.value);
                           console.log(`Element: ${val.value}, Index: ${index}`);   
                        } else if(val.tag=="2001"){
                            cmds1 = cmds1.concat(" ", val.value);
                        }
                      
                     });

                    const st: statusType = c.connection.last_checked_result ? valueEnum[0] : valueEnum[1]
                    return { device_id: String(c.device_id), sn: c.sn, name: descr, status: st, cmds:cmds1, tags: c.device_tags }
                })               
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
                pageSize: 8,
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