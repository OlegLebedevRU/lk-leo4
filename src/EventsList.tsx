
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Switch, Tag, type MenuTheme } from "antd";
//import { PlusOutlined } from '@ant-design/icons';
//import { Button, Tag } from "antd";
import axios from "axios";
import {useState } from "react";


type TableListEvent = {
    createdAtRange?: number[];
    createdAt: number;
    event_code: number;
    dev_event_id: number,
    code: string;
};

type EventListProps = {
    device_id: string;
};

const EventList: React.FC<EventListProps> = (props) => {
    const { device_id } = props;
  //  const actionRef = useRef<ActionType>();
    const [theme, setTheme] = useState<MenuTheme>('dark');
    const changeTheme = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };
    //   const [tableListDataSource, setTableListDataSource] = useState<
    //     TableListEvent[]
    //   >([]);

    const columns: ProColumns<TableListEvent>[] = [
        {
            title: 'Дата/время',
            key: 'createdAt',
            dataIndex: 'createdAt',
            valueType: 'dateTime',
            width: "30%",
        },
        {
            title: 'Nпп',
            key: 'dev_event_id',
            dataIndex:'dev_event_id',
            valueType: 'text',
            
          // width: "10%",
            //  render: (_, item) => {
            //     return (
            //         <Tag>{item.dev_event_id}</Tag>
            //     );
            // }
            
        },
        {
            title: 'Код',
            key: 'event_code',
         //   width: 8,
            dataIndex: 'event_code',
            valueType: 'text',
            render: (_, item) => {
                return (
                    <Tag color="magenta">{item.event_code}</Tag>
                );
            }
        },
        {
            title: 'Описание',
            key: 'description',
            dataIndex:'description',
            valueType: 'text',
            // width: '50%',
             
             render: (_, item) => {
                let descr:string="-";
                switch(item.event_code) {
                    case 44:
                        descr="Пинг";
                        break;
                        case 45:
                        descr="Кнопка";
                        break;
                    case 3:
                    descr=`Карта/пинкод = ${JSON.parse(item.code)['300'][0]['301']}`;
                        break;
                    case 14:
                        descr = `Закрыли замок, плата = ${JSON.parse(item.code)['300'][0]['305']}, порт = ${JSON.parse(item.code)['300'][0]['306']}`
                    }
                return (
                    <p style={{ margin: 0, width: '32ch', font:'bold' }}>{descr}</p>
                );
            }
            
        },
        //{expandable:EXPAND_COLUMN},
        // {
        //   title: 'Содержание',
        //   key: 'code',
        //   width: 360,
        //   dataIndex: 'code',
        //   valueType: 'jsonCode',
        // //   render:(_, item) => {
        // //     return(
        // //         <Collapse
        // //         size="small"
        // //         items={[{ key: '1', label: `This is ${item.event_code}`, children: <p>{item.code}</p> }]}
        // //         />
        // //     );
        // //   }
        // },
        // {
        //   title: 'Опции',
        //   key: 'option',
        //   width: 80,
        //   valueType: 'option',
        //   render: () => [<a key="a">Подробнее</a>],
        // },
    ];


    return (
        <ProTable<TableListEvent>
            headerTitle="События"
            tooltip="Код определяет суть события и состав данных"
            expandable={{
                expandedRowRender: (record) => <p style={{ margin: 0, width: 360 }}>{record.code}</p>,
                //childrenColumnName:"event_code"
            }}
            
           // actionRef={actionRef}
            columns={columns}
            request={async (params, sorter, filter) => {
                // -
                console.log(params, sorter, filter);
                const response = await axios.get('http://127.0.0.1:8000/api/v1/device-events/',
                    { headers: { 'org-id': '0' }, params: {'events_exclude':44,'device_id': device_id, 'page': params.current, 'size':10} }
                    //'size':params.pageSize
                )
                const r = response.data.items
                console.log(r)
                const eventItems: TableListEvent[] = r.map((c: { created_at: string; dev_event_id: number,event_type_code: number; payload: string; }) => {

                    //const st: statusType = c.connection.last_checked_result? valueEnum[0] : valueEnum[1]
                    return { createdAt: c.created_at, dev_event_id: c.dev_event_id, event_code: c.event_type_code, code: c.payload }
                })


                return { data: eventItems, total: response.data.total}

            }}
            toolBarRender={() => [
                <Switch
        checked={theme === 'dark'}
        onChange={changeTheme}
        checkedChildren="Dark"
        unCheckedChildren="Light"
      />
        // <Button
        //   key="button"
        //   icon={<PlusOutlined />}
        //   onClick={() => {
        //     actionRef.current?.reload();
        //   }}
        //   type="primary"
        // >
        //   Обновить
        // </Button>,
            ]}

            options={{reload:true}}
            pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showLessItems: false,
                showTitle: false,

            }}
            rowKey="dev_event_id"
           // toolBarRender={false}
            search={false}
        />);
}

export default EventList