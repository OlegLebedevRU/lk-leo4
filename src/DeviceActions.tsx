//import { PlayCircleFilled, ToolFilled } from "@ant-design/icons";
import { DrawerForm, ProForm, ProFormDateRangePicker, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { message } from "antd";
import { useState } from "react";



//type MenuItem = Required<MenuProps>['items'][number];

// const items: MenuItem[] = [
//   {
//     key: 'sub1',
//     label: 'Системные',
//     icon: <PlayCircleFilled />,
//     children: [
//       { key: '1', label: 'Изменить теги' },
//       { key: '2', label: 'Отправка команды (задание)' },
//       { key: '3', label: 'Пинкод и сертификат' },
//     //  { key: '4', label: 'Option 4' },
//     ],
//   },
//    {
//     key: 'sub2',
//     label: 'Приложение',
//     icon: <ToolFilled />,
//     children: [
//       { key: '5', label: 'Действие по тегу 2001' },
//      // { key: '6', label: 'Отправка команды (задание)' },
//      // { key: '7', label: 'Пинкод и сертификат' },
//     //  { key: '8', label: 'Option 4' },
//     ],
//   },
// ]
type DeviceActionProps = {
    device_id: string;
};

export const DeviceAction: React.FC<DeviceActionProps> = (props) => {
     const { device_id } = props;
 // const [theme, setTheme] = useState<MenuTheme>('dark');
  //const [current, setCurrent] = useState('1');
   const [drawerVisit, setDrawerVisit] = useState(true);

//   const changeTheme = (value: boolean) => {
//     setTheme(value ? 'dark' : 'light');
//   };
console.log('device_id ', device_id);
 // const onClick: MenuProps['onClick'] = (e) => {
//    console.log('click ', e);
    setDrawerVisit(true);
 //   setCurrent(e.key);
  //};

  return (
    <>
     {/* <Menu
   //     theme={theme}
        onClick={onClick}
        style={{ width: 256 }}
        defaultOpenKeys={['sub1']}
        selectedKeys={[current]}
        mode="inline"
        items={items}
      /> */}
    <DrawerForm
        width="95%"
        onOpenChange={setDrawerVisit}
        title="Report title"
        open={drawerVisit}
        onFinish={async () => {
          message.success('Finish success');
          return true;
        }}
      >
        <ProForm.Group>
          <ProFormText
            width="md"
            name="name"
            label="Form group - form text - 1"
            tooltip="tooltip 1"
            placeholder="placeholder1"
          />

          <ProFormText
            width="md"
            name="company"
            label="labelcompany"
            placeholder="placeholdercompany"
          />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormText
            width="md"
            name="contract"
            label="labelcontract"
            placeholder="placeholdercontract"
          />
          <ProFormDateRangePicker name="contractTime" label="contracttime" />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormSelect
            options={[
              {
                value: 'chapter',
                label: 'chaptervalue',
              },
            ]}
            width="xs"
            name="useMode"
            label="usemode"
          />
          <ProFormSelect
            width="xs"
            options={[
              {
                value: 'time',
                label: 'time',
              },
            ]}
            name="unusedMode"
            label="unusedmode"
          />
        </ProForm.Group>
        <ProFormText width="sm" name="id" label="label123" />
        <ProFormText
          name="project"
          disabled
          label="project"
          initialValue="xxxxinitvalue128"
        />
        <ProFormText
          width="xs"
        
          name="mangerName"
          disabled
          label="managername"
          
          initialValue="managernameinitvalue"
        />
        <div>
            <p>
                hjkjj,mndvc xn,x,zxc nsjkdcm xnvmdsc vnmdvdnm dvnsm ncmdmx zccnmdfmc x
                sdmnvhjsamnvjfkdscnm dhjvfndscm vcdkjsfcbdjfhvhu32iewhvbjkedvbjkrdsbvjk fv
            </p>
        </div>
      </DrawerForm>
    </>
   
      
  );
}
