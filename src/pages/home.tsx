import '@ant-design/v5-patch-for-react-19';
import { ProCard } from '@ant-design/pro-components';
import { ConfigProvider, Tabs, theme } from 'antd';
import React, { useState } from 'react';
import Devicelist from './DeviceList';
import EventList from './EventsList';
import DetailList from './TasksList';
import ruRU from 'antd/locale/ru_RU';
import TagList from './DeviceTags';

type DeviceContext = {
    device_id:string | number;
    cmd?: string;
}
// @description Home page component
const Monitoring: React.FC = () => {
    const [current_device, setListTitle] = useState<DeviceContext>({device_id:'--',cmd:'--'});
    const [type, setType] = useState('context');
    const items = [
        {label:"Контекст", key:"context"},
        {label:"Очередь заданий", key:"tasks"},
        {label:"Журнал событий", key:"events"},
        {label:"Теги", key:"tags"},
    ];
    return (
            <ConfigProvider locale={ruRU} theme={{algorithm: theme.compactAlgorithm,}}> 
            <ProCard split="vertical" style={{ left: 0, marginBlockStart: 0 }}>         
                <ProCard  colSpan="50%" style={{ left: 0, marginBlockStart: 0 }}>
                    <Devicelist  onChange={(device_id,cmd) => {setListTitle({device_id:device_id, cmd:cmd}); setType('context');}}  device_id={String(current_device.device_id)} />
                </ProCard>
                        <ProCard  title={`Устройство: ${String(current_device.device_id)}`} style={{  bottom: 0, left:0, marginBlockStart: 40 }} bordered boxShadow>
                            <Tabs activeKey={type} onChange={setType} items={items}></Tabs>
                            {type === 'context' && (
                               <> 
                               <ProCard  title={`Опции устройства:`}></ProCard>
                               {`${String(current_device.cmd)}`}
                               </>                                                                                              
                            )}
                            {type === 'tasks' && (
                                <DetailList device_id={String(current_device.device_id)} />
                            )}
                            {type === 'events' && (
                                <EventList device_id={String(current_device.device_id)} />
                            )}
                            {type === 'tags' && (
                                <       TagList device_id={String(current_device.device_id)} />
                            )}
                        </ProCard>             
            </ProCard>
         </ConfigProvider>
    );
};

export default Monitoring;
