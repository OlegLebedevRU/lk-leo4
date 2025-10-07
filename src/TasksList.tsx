import { ProTable, type ProColumns } from '@ant-design/pro-components';
import { Tag } from "antd";
import axios from "axios";
//import { DeviceAction } from "./DeviceActions";
import NewTask from './CreateNewTask';




type TableListTask = {
    createdAtRange?: number[];
    created_at: number;
    method_code: number;
    priority: number;
    ttl: number;
    status: number;
    code?: string;
    task_id:string;
};

type DetailListProps = {
    device_id: string;
};

const DetailList: React.FC<DetailListProps> = (props) => {
    const { device_id } = props;
  //  const [tableListDataSource, setTableListDataSource] = useState<
  //      TableListTask[]
 //   >([]);
//   const ref = useRef<ProFormInstance>(null);
//    const [dataSource, setDataSource] = useState<TableListTask>();
//const [drawerVisit, setDrawerVisit] = useState(false);
    const columns: ProColumns<TableListTask>[] = [
        {
            title: 'Дата/время',
            key: 'created_at',
            dataIndex: 'created_at',
            valueType: 'dateTime',
             width: '30%',
        },
        {
            title: 'Статус',
            key: 'status',
            width: 8,
            dataIndex: 'status',
            valueType: 'text',
            render: (_, item) => {
                //if(item.method_code===3)
                return (
                    <Tag color= {item.status==3?"green":"red"}>{item.status}</Tag>
                );
            }
        },
        {
            title: 'Код команды',
            key: 'method_code',
            width: 8,
            dataIndex: 'method_code',
            valueType: 'text',
            render: (_, item) => {
                return (
                    <Tag color="blue">{item.method_code}</Tag>
                );
            }
        },
        {
            title: 'Приоритет',
            key: 'priority',
            width: 8,
            dataIndex: 'priority',
            valueType: 'text',
            render: (_, item) => {
                return (
                    <Tag color="yellow">{item.priority}</Tag>
                );
            }
        },
        {
            title: 'TTL',
            key: 'ttl',
            width: 8,
            dataIndex: 'ttl',
            valueType: 'text',
            render: (_, item) => {
                return (
                    <Tag color="grey">{item.ttl}</Tag>
                );
            }
        },
        // {
        //     title: 'Результат',
        //     key: 'result',
        //     width: 360,
        //     dataIndex: 'result',
        //     valueType: 'code',
        // },
        // {
        //     title: 'Опции',
        //     key: 'option',
        //     width: 80,
        //     valueType: 'option',
        //     render: () => [<a key="a">Подробнее</a>],
        // },
    ];

    // useEffect(() => {
    //     const source = [];
    //     for (let i = 0; i < 15; i += 1) {
    //         source.push({
    //             createdAt: Date.now() - Math.floor(Math.random() * 10000),
    //             code: `{"method_code": 20,"priority": 0,
    //     "ttl": 1,"status": 3}`,
    //             key: i,
    //         });
    //     }

    //     setTableListDataSource(source);
    // }, [device_id]);

    return (
        <>
        <ProTable<TableListTask>
            headerTitle="Список заданий (команд)"
            tooltip="Код определяет суть задания и состав данных"
            expandable={{
                expandedRowRender: (record) => {return(
                <p style={{ margin: 0, width: 360 }}>{record.task_id}</p>
            );
                //childrenColumnName:"event_code"
            }}}
            columns={columns}
           // dataSource={tableListDataSource}
            pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showLessItems: false,
                showTitle: false,

            }}
            rowKey="created_at"
            request={async (params, sorter, filter) => {
                // -
                console.log(params, sorter, filter);
                const response = await axios.get('http://127.0.0.1:8000/api/v1/device-tasks/',
                    { headers: { 'org-id': '0' }, params: { 'device_id': device_id, 'page': params.current, 'size':10} }
                    //'size':params.pageSize
                )
                const r = response.data.items
                console.log(r)
                const taskItems: TableListTask[] = r.map((c: 
                    { created_at: string; method_code: number; priority: number;ttl: number; status: number; id:string;}) => {

                    //const st: statusType = c.connection.last_checked_result? valueEnum[0] : valueEnum[1]
                    return { created_at: c.created_at, method_code: c.method_code, priority: c.priority, ttl: c.ttl, status: c.status, task_id: c.id }
                })


                return { data: taskItems, total: response.data.total}

            }}
            toolBarRender={() => [
                <NewTask device_id={device_id}/>
    //             <Switch
    //     checked={theme === 'dark'}
    //     onChange={changeTheme}
    //     checkedChildren="Dark"
    //     unCheckedChildren="Light"
    //   />
        // <Button
        //   key="button"
        //   icon={<PlusOutlined />}
        //   onClick={() => {
        //     console.log("task add button");
        //     // <       DeviceAction device_id={device_id} />
        //     // setDrawerVisit(true);
        //   }}
        //   type="primary"
        // >
        //   Добавить задание
        // </Button>,
            ]}
            search={false}
        />
     
        </>
    );
};

export default DetailList