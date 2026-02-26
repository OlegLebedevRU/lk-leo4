import { DownloadOutlined, PlusOutlined, PoweroffOutlined, SendOutlined, SyncOutlined } from "@ant-design/icons";
import { ModalForm, ProCard, ProDescriptions, ProForm, ProFormDigit, ProFormField, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Button, Divider, Form, message, Space, Typography } from "antd";
import { useState } from "react";
import { axiosPrivate } from "../common/httpPrivate";
//import Title from "antd/es/skeleton/Title";

type NewDeviceTask = {
  ext_task_id: string;
  device_id: number;
  method_code: number;
  priority: number;
  ttl: number;
 
  payload?:string;
};

type DetailListProps = {
  device_id: string;
};
function rstr()  {
    let outString: string = '';
    const inOptions: string = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 20; i++) {
      outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
    }
    return outString;
  };
const NewTask: React.FC<DetailListProps> = (props) => {
  const { device_id } = props;
  const deftask = '{\n"ext_task_id": "s7vlchhitr0qr1hxoywq",\n\
"device_id": 4618,\n"method_code": 20,\n"priority": 1,\n"ttl": 1,\n"payload": "{"dt": [ {"mt": 0 } ]}"\n}';
  const [form] = Form.useForm<NewDeviceTask>();
  const [packet, setPacket] = useState<string>('');
  const [loadings, setLoadings] = useState<boolean[]>([]);
  const [task_resp, setTaskResp] = useState();
   const [task_result, setTaskResult] = useState();
  const enterLoading = (index: number) => {
    console.log('Start loading:', index);

    setLoadings((prevLoadings) => {
      const newLoadings = [...prevLoadings];
      newLoadings[index] = true;
      return newLoadings;
    });

    setTimeout(() => {
      setLoadings((prevLoadings) => {
        const newLoadings = [...prevLoadings];
        newLoadings[index] = false;
        return newLoadings;
      });
    }, 3000);
  };
  
  return (
    <ModalForm<NewDeviceTask>
      
      width="90%"
      
      // onOpenChange={setDrawerVisit}
      title={`Новая задача для ${device_id}`}
      trigger={
        <Button type="primary">
          <PlusOutlined />
          Создать задачу
        </Button>
      }
       submitter={false}
      
      form={form}
      autoFocusFirstInput
      //  formRef={ref}
      onOpenChange={(open) => {
      if(open) {form.setFieldValue('ext_task_id', rstr());
        setPacket(JSON.stringify(form.getFieldsValue(),null,2));
        setTaskResp(undefined);
        setTaskResult(undefined);
         console.log(form.getFieldsValue());}
        return true;
      }}
      onChange={ () => {
       
        setPacket(JSON.stringify(form.getFieldsValue(),null,2));
         console.log(form.getFieldsValue());
        return true;
      }}
      // onFinish={async () => {
      //   console.log(form.getFieldValue('method_code'));
      //   console.log(form.getFieldsValue());
        
      //   // message.success('Finish success');
      //   return true;
      // }}
    >
      <ProCard split="vertical">
        <ProCard>
          <ProFormText
        name="ext_task_id"
       
        label="ext_task_id"
        // initialValue={rstr()}
        
        fieldProps={{ style: {  fontSize: 16, color: '#dae7f0ff', backgroundColor: "#0f0e0eff" } }}
      />
      <ProForm.Group>
        <ProFormDigit
          width="xs"
          name="device_id"
          label="device_id"
          style={{ width: 120, fontWeight: 'bolder' }}
          disabled
          value={Number(device_id)}
          initialValue={Number(device_id)}
        />
        <ProFormDigit
          width="xs"
          name="method_code"
          label="method_code"
          placeholder="method_code"
          initialValue={20}
          min={0}
          max={9999}
        />
        <ProFormDigit
          width="xs"
          name="priority"
          label="priority"
          initialValue={0}
          min={0}
          max={20}
        />
        <ProFormDigit
          width="xs"
          name="ttl"
          label="ttl"
          initialValue={1}
          min={0}
          max={44640}
        // valueType="text"
        />
      </ProForm.Group>
      {/* <Typography.Title level={4}>Предустановленные:</Typography.Title> */}
      {/* <ProForm.Group>
        <ProFormSelect
          label="Название:"
          name="preset"
          // defaultValue="hello"
          style={{ width: 120, fontWeight: 'bolder' }}
          //  onChange={handleChange}
          initialValue='any'
          valueEnum={{
            any: 'Произвольно',
            hello: 'Hello request',
            set_card: 'Записать карту',
            get_cards: 'Запросить карты',
            _disabled: 'Disabled',
          }}
        />
        <ProFormText
          width="xs"
          name="Карта"
          label="cd"
          placeholder="AB3C4F"
        />
      </ProForm.Group> */}
      <Divider variant="dashed" style={{ borderColor: '#7cb305' }} dashed> Payload</Divider>
      {/* <ProFormText width="sm" name="id" label="label123" /> */}
      <ProFormTextArea
        name="payload"
        
        // rows={12}
        label="payload"
        initialValue='{"dt": [ {"mt": 0 } ]}'
        valueType="code"
        fieldProps={{ style: { height:120, fontSize: 14, color: '#dae7f0ff', backgroundColor: "#0f0e0eff" } }}
      />
      {/* <ProFormText
                          width="xs"
                        
                          name="mangerName"
                          disabled
                          label="managername"
                          
                          initialValue="managernameinitvalue"
                        /> */}
      </ProCard>
      <ProCard split="horizontal">
      <ProCard title="Формат пакета задачи" headerBordered collapsible>
        <ProFormField
          // ignoreFormItem
          fieldProps={{
            style: {
              width: '100%', fontSize: 14, color: '#dae7f0ff', backgroundColor: "#0f0e0eff"
            },
          }}
          
          mode="read"
          valueType="code"
         
          text={packet}
        //text={columns[0]}
        />
      <Space> 
      <Button 
          type="primary"
          icon={<SendOutlined />}
          loading={loadings[3] && { icon: <SyncOutlined spin /> }}
          onClick={async () => {
            const resp = await axiosPrivate.post('/api/v1/device-tasks/', form.getFieldsValue());
            setTaskResp(resp.data);
            console.log(resp.data);
            if(resp.status == 200){return;};
          }}
        >Send task</Button>

      <Button 
          type="primary"
          icon={<DownloadOutlined />}
          // loading={loadings[3] && { icon: <SyncOutlined spin /> }}
          onClick={async () => {
            const resp = await axiosPrivate.get('/api/v1/device-tasks/'+String(task_resp['id']));
            setTaskResult(resp.data);
            console.log(resp.data);
            if(resp.status == 200){return;};
          }}
        >Get task result</Button>



</Space>
      </ProCard>
       <Divider variant="dashed" style={{ borderColor: '#3e3f41ff' }} dashed> Response / Result</Divider>
      <ProDescriptions
      column={1}
      // title="Результат"
      // tooltip="Задача"
    >
      <ProDescriptions.Item label="Touch task response" valueType="jsonCode">
        {JSON.stringify(task_resp)}
      </ProDescriptions.Item>
       {/* <ProDescriptions.Item label="Task result" valueType="jsonCode">
        {JSON.stringify(task_result)}
      </ProDescriptions.Item> */}
    </ProDescriptions>

</ProCard>
</ProCard>
 <ProDescriptions
      column={1}
      // props={{ style: { height:120, fontSize: 14, color: '#dae7f0ff', backgroundColor: "#0f0e0eff" } }}
      // title="Результат"
      // tooltip="Задача"
      
    >
     
       <ProDescriptions.Item label="Task result" valueType="jsonCode" 
      //  style= {{fontSize: 14, color: '#dae7f0ff', backgroundColor: "#0f0e0eff" }}
      >
        {JSON.stringify(task_result)}
      </ProDescriptions.Item>
    </ProDescriptions>

    </ModalForm>
  )
}
export default NewTask