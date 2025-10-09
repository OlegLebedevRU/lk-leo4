import { PlusOutlined } from "@ant-design/icons";
import { ModalForm, ProCard, ProForm, ProFormDigit, ProFormField, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Button, Divider, Form, message,  Typography } from "antd";
//import Title from "antd/es/skeleton/Title";

type NewDeviceTask = {
    device_id: number;
    method_code: number;
    priority: number;
    ttl: number;
    code?: string;
};

type DetailListProps = {
    device_id: string;
};

const NewTask: React.FC<DetailListProps> = (props) => {
    const { device_id } = props;  
    const [form] = Form.useForm<NewDeviceTask>();   

return(
     <ModalForm<NewDeviceTask>
         width="80%"
                       // onOpenChange={setDrawerVisit}
         title={`Новая задача для ${device_id}`}
                        trigger={
                            <Button type="primary">
                            <PlusOutlined />
                            Создать задачу
                            </Button>
                        }
                        //open={drawerVisit}
                         form={form}
                        autoFocusFirstInput
                      //  formRef={ref}
                        onChange={async () => {
                          console.log('');
                          return true;
                        }}
                        onFinish={async () => {
                          message.success('Finish success');
                          return true;
                        }}
         >
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
                        <Typography.Title level={4}>Предустановленные:</Typography.Title>
                         <ProForm.Group>
                            
                            <ProFormSelect
                             label="Название:"
                             name="preset"
                          
                               // defaultValue="hello"
                                style={{ width: 120, fontWeight: 'bolder' }}
                                //  onChange={handleChange}
                                initialValue='any'
                                valueEnum={{
                                    any:'Произвольно',
                                     hello: 'Hello request', 
                                    set_card: 'Записать карту',
                                    get_cards: 'Запросить карты' ,
                                    _disabled: 'Disabled',
                                }}
                                />
                        <ProFormText
                            width="xs"
                            name="Карта"
                            label="cd"
                            placeholder="AB3C4F"
                          />
                         </ProForm.Group>
                        <Divider variant="dashed" style={{ borderColor: '#7cb305' }} dashed> Payload</Divider>
                        {/* <ProFormText width="sm" name="id" label="label123" /> */}
                        <ProFormTextArea
                          name="payload"
                         rows={4}
                          label="payload"
                          initialValue="{}"
                          valueType="jsonCode"
                          fieldProps={{style: {fontSize:16, color: '#dae7f0ff',backgroundColor:"#0f0e0eff" }}}
                         
                        />
                        {/* <ProFormText
                          width="xs"
                        
                          name="mangerName"
                          disabled
                          label="managername"
                          
                          initialValue="managernameinitvalue"
                        /> */}
                        <ProCard title="Формат пакета задачи" headerBordered collapsible defaultCollapsed>
                            <ProFormField                        
                            ignoreFormItem
                            fieldProps={{
                                style: {
                                width: '100%',fontSize:16,
                                },
                            }}
                            mode="read"
                            valueType="jsonCode"
                            text={JSON.stringify('{}')}
                            //text={columns[0]}
                            />
                 </ProCard>
     </ModalForm>
)
}
export default NewTask