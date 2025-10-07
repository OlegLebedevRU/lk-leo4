
import '@ant-design/v5-patch-for-react-19';
import { ProCard } from '@ant-design/pro-components';
import { ConfigProvider, Tabs, theme } from 'antd';
import React, { useState } from 'react';
import Devicelist from './DeviceList';
import EventList from './EventsList';
import DetailList from './TasksList';
///import { DeviceAction } from './DeviceActions';
//import enUS from 'antd/locale/en_US';
import ruRU from 'antd/locale/ru_RU';
import TagList from './DeviceTags';
//import { TagList } from './DeviceTags';

type DeviceContext = {
    device_id:string | number;
    cmd?: string;
}

const Demo: React.FC = () => {
    const [current_device, setListTitle] = useState<DeviceContext>({device_id:'--',cmd:'--'});
    const [type, setType] = useState('context');
    // const loc_en:ConfigProviderProps['locale'] = <ConfigProviderProps.locale>(enUS);
    //const actionRef = useRef<ProDescriptionsActionType>();
    return (
              <ConfigProvider
            //   locale={loc_en},
             locale={ruRU}
            theme={{
                //algorithm: theme.defaultAlgorithm,
                // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
                algorithm: theme.compactAlgorithm,
               
            }}
        > 
            <ProCard split="vertical" style={{ left: 0, marginBlockStart: 0 }}>
          
                <ProCard  colSpan="50%" style={{ left: 0, marginBlockStart: 0 }}>
                    {/* ; setType('description') */}
                    <Devicelist  onChange={(device_id,cmd) => {setListTitle({device_id:device_id, cmd:cmd}); setType('context');}}  device_id={String(current_device.device_id)} />
                </ProCard>
                {/* <ConfigProvider
               
                    theme={{
                        algorithm: [theme.compactAlgorithm],
                    }}
                > */}
                    {/* <ProCard></ProCard> */}
                    {/* <ProCard split="horizontal" style={{ bottom: 0, right:0, marginBlockStart: 0 }}> */}
                       {/* <Badge.Ribbon text="Hippies" > */}
                        <ProCard  title={`Устройство: ${String(current_device.device_id)}`} style={{  bottom: 0, left:0, marginBlockStart: 40 }} bordered boxShadow>
                             {/* device_id={current_device_id} */}
                            {/* <h3>Подробности устройства</h3>    */}
                            <Tabs activeKey={type} onChange={(e) => setType(e)}>
                                <Tabs.TabPane tab="Контекст" key="context" />
                                {/* <Tabs.TabPane tab="Действия" key="actions" /> */}
                                <Tabs.TabPane tab="Очередь заданий" key="tasks" />
                                <Tabs.TabPane tab="Журнал событий" key="events" />
                                <Tabs.TabPane tab="Теги" key="tags" />
                            </Tabs>
                            {type === 'context' && (
                               <> 
                               < ProCard  title={`Опции устройства:`}>
                               </ProCard>
                               {`${String(current_device.cmd)}`}
                               </>
                                
                               
                                 
                            )}
                            {type === 'tasks' && (
                                <DetailList device_id={String(current_device.device_id)} />
                            )}
                            {type === 'events' && (
                                <EventList device_id={String(current_device.device_id)} />
                            )}
                            {/* {type === 'actions' && (
                                <       DeviceAction device_id={String(current_device.device_id)} />
                            )} */}
                            {type === 'tags' && (
                                <       TagList device_id={String(current_device.device_id)} />
                            )}
                        {/* </Badge.Ribbon> */}
                        </ProCard>
                            {/* </Badge.Ribbon> */}
                    {/* </ProCard> */}
                {/* </ConfigProvider> */}
                {/* <ProCard >
                </ProCard> */}
               
            </ProCard>
         </ConfigProvider>
    );
};

export default Demo;
