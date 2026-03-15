import {
  DownloadOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  ProCard,
  ProDescriptions,
  ProForm,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Button, Divider, Form, Space } from 'antd';
import { useState } from 'react';
import { fetchTaskDetail } from '../features/tasks/api/tasks';
import { formatJson, buildPacketPreview, generateExtTaskId, submitTask } from '../features/tasks/domain/taskCreation';
import type { NewDeviceTaskFormValues } from '../features/tasks/types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
type DetailListProps = {
  device_id: string;
};

// Для корректной типизации правил валидации

// === Стиль для блока JSON ===
// const codeBlockStyle = {
//   margin: 0,
//   fontSize: '12px',
//   fontFamily: 'Consolas, Monaco, "Courier New", monospace',
//   color: '#dcdcdc',
//   background: '#1e1e1e',
//   padding: '12px',
//   borderRadius: '6px',
//   border: '1px solid #3c3c3c',
//   overflow: 'auto' as const,
//   maxHeight: '300px',
// };

// === Компонент ===
const NewTask: React.FC<DetailListProps> = ({ device_id }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<NewDeviceTaskFormValues>();
  const [loadings, setLoadings] = useState<boolean[]>([]);
  const [taskResp, setTaskResp] = useState<{ id: string | number } | undefined>(undefined);
  const [taskResult, setTaskResult] = useState<unknown>(undefined);

  // Отслеживаем значения формы для предпросмотра
  const formValues = Form.useWatch([], form);

  // Динамически генерируем JSON-представление
  const packet = formValues ? buildPacketPreview(formValues) : '';

  const enterLoading = (index: number) => {
    setLoadings((prev) => {
      const newLoadings = [...prev];
      newLoadings[index] = true;
      return newLoadings;
    });

    setTimeout(() => {
      setLoadings((prev) => {
        const newLoadings = [...prev];
        newLoadings[index] = false;
        return newLoadings;
      });
    }, 3000);
  };

  return (
    <ModalForm<NewDeviceTaskFormValues>
      title={`Новая задача для ${device_id}`}
      trigger={
        <Button type="primary">
          <PlusOutlined />
          Создать задачу
        </Button>
      }
      width="90%"
      form={form}
      submitter={false}
      autoFocusFirstInput
      onOpenChange={(open) => {
        if (open) {
          form.resetFields();
          form.setFieldsValue({
            device_id: Number(device_id),
            method_code: 20,
            priority: 0,
            ttl: 1,
            ext_task_id: generateExtTaskId(),
            dt: JSON.stringify([{ mt: 0 }], null, 2),
          });
          setTaskResp(undefined);
          setTaskResult(undefined);
        }
      }}
    >
      <ProCard split="vertical">
        {/* Левая часть: форма */}
        <ProCard>
          <ProFormText
            name="ext_task_id"
            label="ext_task_id"
            fieldProps={{
              style: {
                fontSize: 16,
                color: '#dae7f0ff',
                backgroundColor: '#0f0e0eff',
              },
            }}
          />

          <ProForm.Group>
            <ProFormDigit
              name="device_id"
              label="device_id"
              width="xs"
              initialValue={Number(device_id)}
              disabled
              style={{ width: 120, fontWeight: 'bolder' }}
            />
           
            <ProFormDigit
              name="priority"
              label="priority"
              width="xs"
              initialValue={0}
              min={0}
              max={20}
            />
            <ProFormDigit
              name="ttl"
              label="ttl"
              width="xs"
              initialValue={1}
              min={0}
              max={44640}
            />
          </ProForm.Group>
          <Divider variant="dashed" style={{ borderColor: '#7cb305' }}>
            Код задачи (команды)
          </Divider>
          <ProFormDigit
              name="method_code"
              label="method_code"
              width="xs"
              initialValue={20}
              min={0}
              max={9999}
            />
          <Divider variant="dashed" style={{ borderColor: '#7cb305' }}>
            Payload (данные задачи)
          </Divider>

<ProFormTextArea
  name="dt"
  label="dt - массив объектов/строк/чисел"
  initialValue={JSON.stringify([{ mt: 0 }], null, 2)}
  fieldProps={{
    style: {
      height: 120,
      fontSize: 16,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      backgroundColor: '#0f0e0eff',
      color: '#dae7f0ff',
      resize: 'vertical',
    },
    autoSize: { minRows: 4, maxRows: 8 },
    onChange: (e) => {
      const formatted = formatJson(e.target.value);
      form.setFieldsValue({ dt: formatted });
    },
  }}
  rules={[
    {
      validator: async (_: any, value: string | undefined) => {
        if (!value?.trim()) return;
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('dt должен быть массивом');
          }
        } catch {
          throw new Error('dt должен быть валидным JSON-массивом');
        }
      },
    },
  ]}
/>
        </ProCard>

        {/* Правая часть: предпросмотр и действия */}
        <ProCard split="horizontal">
          <ProCard
            title="Формат пакета задачи"
            headerBordered
            collapsible
          >
            <ProForm.Item noStyle>
  <SyntaxHighlighter
    language="json"
    style={materialDark} // Или другая тема, например, dark или materialDark
    customStyle={{
      margin: 0,
      fontSize: '12px',
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #3c3c3c',
      overflow: 'auto',
      maxHeight: '300px',
      background: '#1e1e1e', // Совпадает с вашим codeBlockStyle
    }}
  >
    {packet}
  </SyntaxHighlighter>
</ProForm.Item>

            <Space style={{ marginTop: 12 }} wrap orientation="horizontal">
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loadings[3]}
                onClick={async () => {
                  try {
                    enterLoading(3);
                    await form.validateFields();
                    const values = form.getFieldsValue();
                    const resp = await submitTask(values);
                    setTaskResp(resp);
                    message.success('Задача отправлена');
                  } catch (e) {
                    const errorMsg =
                      e instanceof Error ? e.message : 'Не удалось отправить задачу';
                    message.error(errorMsg);
                  }
                }}
              >
                Отправить задачу
              </Button>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={async () => {
                  if (!taskResp?.id) {
                    message.warning('Сначала отправьте задачу (нет id)');
                    return;
                  }
                  try {
                    const resp = await fetchTaskDetail(taskResp.id.toString());
                    setTaskResult(resp);
                    message.success('Результат получен');
                 } catch (e) {
                  const errorMsg = e instanceof Error ? e.message : 'Ошибка при получении результата';
                   message.error(errorMsg);
                  }
                }}
              >
                Получить результат
              </Button>
            </Space>
          </ProCard>

          <Divider variant="dashed" style={{ borderColor: '#3e3f41ff' }}>
            Ответ / Результат
          </Divider>

          <ProDescriptions column={1} bordered>
            <ProDescriptions.Item label="Ответ сервера">
              <SyntaxHighlighter
                language="json"
                style={vs}
                customStyle={{
                  margin: 0,
                  fontSize: '12px',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #d9d9d9',
                  overflow: 'auto',
                  maxHeight: '300px',
                  background: '#f5f5f5',
                }}
              >
                {taskResp ? JSON.stringify(taskResp, null, 2) : '—'}
              </SyntaxHighlighter>
            </ProDescriptions.Item>
            <ProDescriptions.Item label="Результат задачи">
              <SyntaxHighlighter
                language="json"
                style={vs}
                customStyle={{
                  margin: 0,
                  fontSize: '12px',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #d9d9d9',
                  overflow: 'auto',
                  maxHeight: '300px',
                  background: '#f5f5f5',
                }}
              >
                {taskResult ? JSON.stringify(taskResult, null, 2) : '—'}
              </SyntaxHighlighter>
            </ProDescriptions.Item>
          </ProDescriptions>
        </ProCard>
      </ProCard>
    </ModalForm>
  );
};

export default NewTask;