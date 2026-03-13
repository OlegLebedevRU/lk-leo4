import { DownloadOutlined, PlusOutlined, SendOutlined } from "@ant-design/icons";
import {
  ModalForm,
  ProCard,
  ProDescriptions,
  ProForm,
  ProFormDigit,
  ProFormField,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { Button, Divider, Form, message, Space } from "antd";
import { useState } from "react";
import { axiosPrivate } from "../common/httpPrivate";

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

type NewDeviceTaskFormValues = Omit<NewDeviceTask, "payload"> & {
  payload?: string;
};

type DetailListProps = {
  device_id: string;
};

type Rule = { field: string }; // Для устранения ошибки типа

// === Валидация payload ===
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePayload(payloadText: string | undefined): DeviceTaskPayload | undefined {
  const raw = payloadText?.trim();
  if (!raw) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("payload должен быть валидным JSON");
  }

  if (!isRecord(parsed)) {
    throw new Error("payload должен быть объектом");
  }

  const dt = parsed["dt"];
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
      2
    );
  }
}

// === Генерация случайного ext_task_id ===
function rstr(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// === Стиль для блока JSON ===
const codeBlockStyle = {
  margin: 0,
  fontSize: "12px",
  fontFamily: "Consolas, Monaco, 'Courier New', monospace",
  color: "#dcdcdc",
  background: "#1e1e1e",
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #3c3c3c",
  overflow: "auto" as const,
  maxHeight: "300px",
};

// === Компонент ===
const NewTask: React.FC<DetailListProps> = ({ device_id }) => {
  const [form] = Form.useForm<NewDeviceTaskFormValues>();
  const [loadings, setLoadings] = useState<boolean[]>([]);
  const [task_resp, setTaskResp] = useState<{ id: string | number } | undefined>(undefined);
  const [task_result, setTaskResult] = useState<unknown>(undefined);

  // Отслеживаем значения формы
  const formValues = Form.useWatch([], form);

  // ✅ Вычисляем packet напрямую — без setState в useEffect
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
            ext_task_id: rstr(),
            payload: '{"dt": [ {"mt": 0 } ]}',
          });
          setTaskResp(undefined);
          setTaskResult(undefined);
        }
        return true;
      }}
    >
      <ProCard split="vertical">
        {/* Левая часть: форма ввода */}
        <ProCard>
          <ProFormText
            name="ext_task_id"
            label="ext_task_id"
            fieldProps={{
              style: {
                fontSize: 16,
                color: "#dae7f0ff",
                backgroundColor: "#0f0e0eff",
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
              style={{ width: 120, fontWeight: "bolder" }}
            />
            <ProFormDigit
              name="method_code"
              label="method_code"
              width="xs"
              initialValue={20}
              min={0}
              max={9999}
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

          <Divider variant="dashed" style={{ borderColor: "#7cb305" }}>
            Payload
          </Divider>

          <ProFormTextArea
            name="payload"
            label="payload"
            initialValue='{"dt": [ {"mt": 0 } ]}'
            valueType="code"
            fieldProps={{
              style: {
                height: 120,
                fontSize: 14,
                color: "#dae7f0ff",
                backgroundColor: "#0f0e0eff",
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
          <ProCard title="Формат пакета задачи" headerBordered collapsible>
            <ProFormField
              mode="read"
              valueType="code"
              text={packet}
              fieldProps={{
                style: {
                  width: "100%",
                  fontSize: 14,
                  color: "#dae7f0ff",
                  backgroundColor: "#0f0e0eff",
                },
              }}
            />

            <Space style={{ marginTop: 12 }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loadings[3]}
                onClick={async () => {
                  try {
                    enterLoading(3);
                    await form.validateFields();
                    const task = toNewDeviceTaskRequest(form.getFieldsValue());
                    const resp = await axiosPrivate.post("/api/v1/device-tasks/", task);
                    setTaskResp(resp.data);
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Не удалось отправить задачу";
                    message.error(msg);
                  }
                }}
              >
                Send task
              </Button>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={async () => {
                  if (!task_resp?.id) {
                    message.warning("Сначала отправьте задачу (нет id)");
                    return;
                  }
                  const resp = await axiosPrivate.get(`/api/v1/device-tasks/${task_resp.id}`);
                  setTaskResult(resp.data);
                }}
              >
                Get task result
              </Button>
            </Space>
          </ProCard>

          <Divider variant="dashed" style={{ borderColor: "#3e3f41ff" }}>
            Response / Result
          </Divider>

          <ProDescriptions column={1}>
            <ProDescriptions.Item label="Touch task response">
              <pre style={codeBlockStyle}>
                {task_resp ? JSON.stringify(task_resp, null, 2) : "—"}
              </pre>
            </ProDescriptions.Item>
          </ProDescriptions>

          <ProDescriptions column={1}>
            <ProDescriptions.Item label="Task result">
              <pre style={codeBlockStyle}>
                {task_result ? JSON.stringify(task_result, null, 2) : "—"}
              </pre>
            </ProDescriptions.Item>
          </ProDescriptions>
        </ProCard>
      </ProCard>
    </ModalForm>
  );
};

export default NewTask;