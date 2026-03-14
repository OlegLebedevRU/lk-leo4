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
import { Button, Divider, Form, message, Space } from 'antd';
import { useState } from 'react';
import { axiosPrivate } from '../common/httpPrivate';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Тёмная тема, подходящая под ваш стиль
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Светлая тема
// Добавьте это после импортов, перед типами или функциями
function formatJson(value: string): string {
  if (!value.trim()) return value;
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2); // 2 пробела для отступов
  } catch {
    // Если JSON невалиден, возвращаем как есть (чтобы не ломать ввод)
    return value;
  }
}
// === Типы ===
type DeviceTaskPayload = Record<string, unknown> & {
  dt: Array<Record<string, unknown>>;
};

type NewDeviceTask = {
  ext_task_id: string;
  device_id: number;
  method_code: number;
  priority: number;
  ttl: number;
  payload?: DeviceTaskPayload;
};

type NewDeviceTaskFormValues = Omit<NewDeviceTask, 'payload'> & {
  payload?: string;
};

type DetailListProps = {
  device_id: string;
};

// Для корректной типизации правил валидации
type Rule = { field: string };

// === Валидация payload ===
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePayload(payloadText: string | undefined): DeviceTaskPayload | undefined {
  const raw = payloadText?.trim();
  if (!raw) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('payload должен быть валидным JSON');
  }

  if (!isRecord(parsed)) {
    throw new Error('payload должен быть объектом');
  }

  const dt = parsed.dt;
  if (!Array.isArray(dt)) {
    throw new Error('payload должен содержать массив объектов в поле "dt"');
  }
  if (!dt.every(isRecord)) {
    throw new Error('payload.dt должен быть массивом объектов');
  }

  return parsed as DeviceTaskPayload;
}

// === Формирование задачи ===
function toNewDeviceTaskRequest(values: NewDeviceTaskFormValues): NewDeviceTask {
  const { payload: payloadText, ...rest } = values;
  const payload = parsePayload(payloadText);
  return {
    ...rest,
    ...(payload ? { payload } : {}),
  };
}

function buildPacketPreview(values: NewDeviceTaskFormValues): string {
  try {
    return JSON.stringify(toNewDeviceTaskRequest(values), null, 2);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return JSON.stringify(
      {
        ...values,
        payload_error: errorMessage,
      },
      null,
      2,
    );
  }
}

// === Генерация случайного ext_task_id ===
function generateExtTaskId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
            payload: '{"dt": [ {"mt": 0 } ]}',
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
            Payload
          </Divider>

<ProFormTextArea
  name="payload"
  label="payload"
  initialValue={JSON.stringify({ dt: [{ mt: 0 }] }, null, 2)}
  fieldProps={{
    style: {
      height: 180,
      fontSize: 18,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      backgroundColor: '#0f0e0eff',
      color: '#dae7f0ff',
      resize: 'vertical',
    },
    autoSize: { minRows: 6, maxRows: 10 },
    onChange: (e) => {
      const formatted = formatJson(e.target.value);
      // Устанавливаем отформатированное значение обратно в поле
      form.setFieldsValue({ payload: formatted });
    },
  }}
  rules={[
    {
      validator: async (_rule: Rule, value: string | undefined) => {
        if (!value?.trim()) return;
        parsePayload(value);
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

            <Space style={{ marginTop: 12 }} wrap>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loadings[3]}
                onClick={async () => {
                  try {
                    enterLoading(3);
                    await form.validateFields();
                    const task = toNewDeviceTaskRequest(form.getFieldsValue());
                    const resp = await axiosPrivate.post('/device-tasks/', task);
                    setTaskResp(resp.data);
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
                    const resp = await axiosPrivate.get(`/device-tasks/${taskResp.id}`);
                    setTaskResult(resp.data);
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

          <ProDescriptions column={1}>
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
      border: '1px solid #d9d9d9', // Светлая граница для светлого фона
      overflow: 'auto',
      maxHeight: '300px',
      background: '#f5f5f5', // Светлый фон, подходящий под тему vs
    }}
  >
    {taskResp ? JSON.stringify(taskResp, null, 2) : '—'}
  </SyntaxHighlighter>
</ProDescriptions.Item>
          </ProDescriptions>

          <ProDescriptions column={1}>
           <ProDescriptions.Item label="Результат задачи">
  <SyntaxHighlighter
    language="json"
    // style={vs}
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