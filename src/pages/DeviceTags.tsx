import { EditableProTable, type ProColumns } from "@ant-design/pro-components";
import { Switch, Tag, Typography, type MenuTheme } from "antd";
import { useState } from "react";
import axios from "axios";

type DeviceTagEditable ={
    tag?:string;
    value?:string;
  id: React.Key;
  created_at?: number;
  is_system_tag?: boolean;
  children?:DeviceTagEditable[];
};
// const defaultData: DeviceTagEditable[]=[
//     {
//         id:678767,
//         tag:"7777",
//         value:"test 777",
//         is_system_tag:false,
//         created_at:1590486176000

//     },
//     {
//         id:678768,
//         tag:"8888",
//         value:"test 8888",
//         is_system_tag:false,
//         created_at:1590486178000

//     },
// ]

type TagListProps = {
    device_id: string;
};

const TagList: React.FC<TagListProps> = (props) => {
    const { Text } = Typography;
    const { device_id } = props;
    const [theme, setTheme] = useState<MenuTheme>('dark');
    const changeTheme = (value: boolean) => {
        setTheme(value ? 'dark' : 'light');
      };
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
    const [dataSource, setDataSource] = useState<readonly DeviceTagEditable[]>([]);
    const columns: ProColumns<DeviceTagEditable>[] = [
         {
                    title: 'Тег',
                    key: 'tag',
                    width: "20%",
                    dataIndex: 'tag',
                   editable: () => {
                     return true;
                    },
                    valueType: 'text',
                    render: (_, item) => {
                        return (
                            <Tag color="blue">{item.tag}</Tag>
                        );
                    }
                },
                {
                    title: 'Значение',
                    key: 'value',
                    width: "50%",
                    dataIndex: 'value',
                    valueType: 'text',
                    render: (_, item) => {
                        return (
                            <Text keyboard >{item.value}</Text>
                        );
                    }
                },

        {
            title: 'Опции',
            valueType: 'option',
            width: "30%",
            render: (_text, record, _, action) => [
                <a
                key="editable"
                onClick={() => {
                    action?.startEditable?.(record.id);
                }}
                >
                Изменить
                </a>,
                <a
                key="delete"
                onClick={() => {
                    setDataSource(dataSource.filter((item) => item.id !== record.id));
                    action?.reload();
                }}
                >
                Удалить
                </a>,
      ],
    },   
]
return (
      <EditableProTable<DeviceTagEditable>
        rowKey="id"
        headerTitle="Теги устройства"
        scroll={{  }}
        recordCreatorProps={
           { record: () => ({ id: (Math.random() * 1000000).toFixed(0) }),
            position:'top',size:'small',creatorButtonText:"Добавить тег"}           
        }
       // loading={false}
        columns={columns}
        request={async (params, sorter, filter) => {
                        console.log(params, sorter, filter);    
                        const {data} = await axios.get('https://dev.leo4.ru/api/v1/devices/', 
                            {withCredentials:true, params: {'device_id': device_id} });                      
                        const tagItems: DeviceTagEditable[] = data[0].device_tags.map(
                            (c: {id:number, created_at: string; tag: string; value: string; is_system_tag: boolean}) => {        
                            return {id:c.id, created_at:c.created_at, tag: c.tag, value:c.value, is_system_tag: c.is_system_tag }
                        });
                        return { data: tagItems, success:true}        
                    }}
        options={{reload:true}}
        onChange={setDataSource}
        editable={{
          type: 'multiple',
          editableKeys,
          onSave: async (rowKey, data, row) => {
            console.log(rowKey, data, row);
          },
          onChange: setEditableRowKeys,
        }}
        pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showLessItems: false,
                showTitle: false,

            }}
        toolBarRender={() => [
                        <Switch
                checked={theme === 'dark'}
                onChange={changeTheme}
                checkedChildren="Dark"
                unCheckedChildren="Light"
                />
        ]}
      />
);
}
export default TagList