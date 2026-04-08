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
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { App, Button, Divider, Form, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useCreateTask, useGetTaskResult } from '../hooks/useTasks';
import { buildPacketPreview, generateExtTaskId, toNewDeviceTaskRequest } from '../features/tasks/domain/taskCreation';
import { getMethodCodeConfig, getMethodCodeOptions } from '../features/tasks/domain/methodCodes';
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
  const [taskResp, setTaskResp] = useState<{ id: string | number } | undefined>(undefined);
  const [taskResult, setTaskResult] = useState<unknown>(undefined);
  // Тип для поддержки разных форматов: method_code=16 (dt_cd, dt_cl) и method_code=49 (dt_ns, dt_k, dt_t, dt_v)
  type DtItemType = { dt_cd?: string; dt_cl?: number; dt_ns?: string; dt_k?: string; dt_t?: string; dt_v?: string };
  const [dtItems, setDtItems] = useState<DtItemType[]>([{ dt_cd: '', dt_cl: 1 }]);
  const [serverResponseBlink, setServerResponseBlink] = useState(false);

  // Используем React Query хуки
  const createTaskMutation = useCreateTask();
  const getTaskResultMutation = useGetTaskResult();

  // Отслеживаем значения формы для предпросмотра
  const formValues = Form.useWatch([], form);

  // Динамически генерируем JSON-представление
  const packet = formValues ? buildPacketPreview(formValues) : '';
  
  // Проверяем валидность пакета
  const isValidPacket = packet.length > 0 && packet !== '{}';

  // Состояние кнопок
  const canSubmit = isValidPacket && !createTaskMutation.isPending && !getTaskResultMutation.isPending;
  const canGetResult = !!taskResp && !getTaskResultMutation.isPending;

  // Эффект моргания при получении ответа сервера
  useEffect(() => {
    if (taskResp) {
      setServerResponseBlink(true);
      const timer = setTimeout(() => setServerResponseBlink(false), 300);
      return () => clearTimeout(timer);
    }
  }, [taskResp]);

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
          // Получаем конфигурацию для method_code=20 (по умолчанию)
          const defaultMethodCode = 20;
          const config = getMethodCodeConfig(defaultMethodCode);
          const defaultDtValues: Record<string, unknown> = {};
          if (config) {
            // dtFields может быть undefined для method_code=21 (dtFormat: "empty")
            config.dtFields?.forEach(field => {
              defaultDtValues[field.fieldName] = field.defaultValue;
            });
            // Для поддержки множественных объектов
            if (config.supportsMultiple) {
              if (config.dtFormat === 'dbWrite') {
                // Для записи в БД используем другие поля
                defaultDtValues.dt_items = [{ dt_ns: '', dt_k: '', dt_t: 'i32', dt_v: '' }];
                setDtItems([{ dt_ns: '', dt_k: '', dt_t: 'i32', dt_v: '' }]);
              } else {
                defaultDtValues.dt_items = [{ dt_cd: '', dt_cl: 1 }];
                setDtItems([{ dt_cd: '', dt_cl: 1 }]);
              }
            } else {
              setDtItems([{ dt_cd: '', dt_cl: 1 }]);
            }
          }
          form.setFieldsValue({
            device_id: Number(device_id),
            method_code: defaultMethodCode,
            priority: 0,
            ttl: 1,
            ext_task_id: generateExtTaskId(),
            ...defaultDtValues,
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
          <ProFormSelect
              name="method_code"
              label="Код задачи"
              width="lg"
              initialValue={20}
              options={getMethodCodeOptions()}
              fieldProps={{
                onChange: (value) => {
                  // Сброс значений dt при смене method_code
                  const config = getMethodCodeConfig(value as number);
                  if (config) {
                    const defaultValues: Record<string, unknown> = {};
                    // dtFields может быть undefined для method_code=21 (dtFormat: "empty")
                    config.dtFields?.forEach(field => {
                      defaultValues[field.fieldName] = field.defaultValue;
                    });
                    // Для поддержки множественных объектов
                    if (config.supportsMultiple) {
                      if (config.dtFormat === 'dbWrite') {
                        // Для записи в БД используем другие поля
                        defaultValues.dt_items = [{ dt_ns: '', dt_k: '', dt_t: 'i32', dt_v: '' }];
                        setDtItems([{ dt_ns: '', dt_k: '', dt_t: 'i32', dt_v: '' }]);
                      } else {
                        defaultValues.dt_items = [{ dt_cd: '', dt_cl: 1 }];
                        setDtItems([{ dt_cd: '', dt_cl: 1 }]);
                      }
                    }
                    form.setFieldsValue(defaultValues);
                  }
                }
              }}
              tooltip={(() => {
                const methodCode = form.getFieldValue('method_code') || 20;
                const config = getMethodCodeConfig(methodCode);
                return config?.dropdownTooltip;
              })()}
            />
          <Divider variant="dashed" style={{ borderColor: '#7cb305' }}>
            Параметры команды (dt)
          </Divider>
          
          {/* Динамические поля для dt в зависимости от method_code */}
          {(() => {
            const methodCode = form.getFieldValue('method_code') || 20;
            const config = getMethodCodeConfig(methodCode);
            if (!config) return null;
            
            // Для метода с пустым dt (например, method_code=21)
            if (!config.dtFields || config.dtFields.length === 0) {
              return (
                <div style={{ marginBottom: 16, color: '#888', fontSize: 12 }}>
                  {config.description}
                </div>
              );
            }
            
            // Для поддержки множественных объектов (method_code=16, 49)
            if (config.supportsMultiple) {
              // Используем useState для управления списком
              
              // Проверяем формат dbWrite для method_code=49
              if (config.dtFormat === 'dbWrite') {
                const currentItems = form.getFieldValue('dt_items') as DtItemType[] | undefined;
                const items: DtItemType[] = currentItems && currentItems.length > 0 ? currentItems : dtItems;
                
                return (
                  <>
                    {items.map((item, index) => (
                      <ProForm.Group key={index} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                        <ProFormText
                          name={['dt_items', index, 'dt_ns']}
                          label={index === 0 ? 'Раздел БД' : ''}
                          tooltip={index === 0 ? 'Имя раздела базы данных (ns)' : undefined}
                          placeholder="system"
                          style={{ width: 120 }}
                          fieldProps={{
                            onChange: (e) => {
                              const newItems = [...items];
                              newItems[index] = { ...newItems[index], dt_ns: e.target.value };
                              form.setFieldsValue({ dt_items: newItems });
                            }
                          }}
                        />
                        <ProFormText
                          name={['dt_items', index, 'dt_k']}
                          label={index === 0 ? 'Ключ' : ''}
                          tooltip={index === 0 ? 'Ключ параметра (k)' : undefined}
                          placeholder="param_name"
                          style={{ width: 120 }}
                          fieldProps={{
                            onChange: (e) => {
                              const newItems = [...items];
                              newItems[index] = { ...newItems[index], dt_k: e.target.value };
                              form.setFieldsValue({ dt_items: newItems });
                            }
                          }}
                        />
                        <ProFormSelect
                          name={['dt_items', index, 'dt_t']}
                          label={index === 0 ? 'Тип' : ''}
                          tooltip={index === 0 ? 'Тип данных (t)' : undefined}
                          initialValue={(item as { dt_t?: string }).dt_t || 'i32'}
                          options={[
                            { value: 'i8', label: 'i8' },
                            { value: 'u8', label: 'u8' },
                            { value: 'i16', label: 'i16' },
                            { value: 'u16', label: 'u16' },
                            { value: 'i32', label: 'i32' },
                            { value: 'u32', label: 'u32' },
                            { value: 'str', label: 'str' },
                          ]}
                          style={{ width: 80 }}
                        />
                        <ProFormText
                          name={['dt_items', index, 'dt_v']}
                          label={index === 0 ? 'Значение' : ''}
                          tooltip={index === 0 ? 'Значение параметра (v)' : undefined}
                          placeholder="123"
                          style={{ width: 100 }}
                          fieldProps={{
                            onChange: (e) => {
                              const newItems = [...items];
                              newItems[index] = { ...newItems[index], dt_v: e.target.value };
                              form.setFieldsValue({ dt_items: newItems });
                            }
                          }}
                        />
                        {items.length > 1 && (
                          <Button
                            type="text"
                            danger
                            onClick={() => {
                              const newItems = items.filter((_, i) => i !== index);
                              setDtItems(newItems);
                              form.setFieldsValue({ dt_items: newItems });
                            }}
                          >
                            ✕
                          </Button>
                        )}
                      </ProForm.Group>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => {
                        const newItems = [...items, { dt_ns: '', dt_k: '', dt_t: 'i32', dt_v: '' }];
                        setDtItems(newItems);
                        form.setFieldsValue({ dt_items: newItems });
                      }}
                      icon={<PlusOutlined />}
                      style={{ marginTop: 8 }}
                    >
                      Добавить ещё
                    </Button>
                    <div style={{ marginTop: 8, marginBottom: 16, color: '#888', fontSize: 12 }}>
                      {config.description}
                    </div>
                </>
              );
              }
            }
            
            // Группировка полей по группам (например, для method_code=16)
            const groups = config.dtFields.reduce((acc, field) => {
              const groupName = field.group || 'default';
              if (!acc[groupName]) {
                acc[groupName] = [];
              }
              acc[groupName].push(field);
              return acc;
            }, {} as Record<string, typeof config.dtFields>);
            
            return (
              <>
                {Object.entries(groups).map(([groupName, fields]) => (
                  <ProForm.Group key={groupName} style={{ marginBottom: 8 }}>
                    {fields.map((field) => {
                      if (field.type === 'numberArray') {
                        return (
                          <ProFormText
                            key={field.fieldName}
                            name={field.fieldName}
                            label={field.label}
                            tooltip={field.tooltip}
                            initialValue={JSON.stringify(field.defaultValue)}
                            fieldProps={{
                              placeholder: field.example ? `Например: ${field.example}` : undefined,
                            }}
                            rules={[
                              {
                                validator: async (_: unknown, value: string | undefined) => {
                                  if (!value?.trim()) return;
                                  try {
                                    const parsed = JSON.parse(value);
                                    if (!Array.isArray(parsed)) {
                                      throw new Error('Значение должно быть массивом');
                                    }
                                  } catch {
                                    throw new Error('Введите массив в формате JSON, например: [1, 2]');
                                  }
                                },
                              },
                            ]}
                          />
                        );
                      }
                      if (field.type === 'number') {
                        return (
                          <ProFormDigit
                            key={field.fieldName}
                            name={field.fieldName}
                            label={field.label}
                            tooltip={field.tooltip}
                            initialValue={field.defaultValue}
                            fieldProps={{
                              placeholder: field.example ? `Например: ${field.example}` : undefined,
                            }}
                          />
                        );
                      }
                      if (field.type === 'select') {
                        return (
                          <ProFormSelect
                            key={field.fieldName}
                            name={field.fieldName}
                            label={field.label}
                            tooltip={field.tooltip}
                            initialValue={field.defaultValue}
                            options={field.options || []}
                            fieldProps={{
                              placeholder: field.example ? `Например: ${field.example}` : undefined,
                            }}
                          />
                        );
                      }
                      if (field.type === 'string') {
                        const rules = [];
                        if (field.required) {
                          rules.push({ required: true, message: `${field.label} обязательно` });
                        }
                        if (field.validationRegex) {
                          const regex = new RegExp(field.validationRegex);
                          const msg = field.validationMessage || `Значение не соответствует формату`;
                          rules.push({
                            validator: async (_: unknown, value: string | undefined) => {
                              if (!value?.trim()) return;
                              if (!regex.test(value.trim())) throw new Error(msg);
                            },
                          });
                        }
                        return (
                          <ProFormText
                            key={field.fieldName}
                            name={field.fieldName}
                            label={field.label}
                            tooltip={field.tooltip}
                            initialValue={field.defaultValue}
                            rules={rules.length > 0 ? rules : undefined}
                            fieldProps={{
                              placeholder: field.example ? `Например: ${field.example}` : undefined,
                            }}
                          />
                        );
                      }
                      // stringArray type
                      return (
                        <ProFormText
                          key={field.fieldName}
                          name={field.fieldName}
                          label={field.label}
                          tooltip={field.tooltip}
                          initialValue={JSON.stringify(field.defaultValue)}
                          fieldProps={{
                            placeholder: field.example ? `Например: ${field.example}` : undefined,
                          }}
                          rules={[
                            {
                              validator: async (_: unknown, value: string | undefined) => {
                                if (!value?.trim()) return;
                                try {
                                  const parsed = JSON.parse(value);
                                  if (!Array.isArray(parsed)) {
                                    throw new Error('Значение должно быть массивом');
                                  }
                                } catch {
                                  throw new Error('Введите массив в формате JSON, например: ["123456"]');
                                }
                              },
                            },
                          ]}
                        />
                      );
                    })}
                  </ProForm.Group>
                ))}
                {config.description && (
                  <div style={{ marginBottom: 16, color: '#888', fontSize: 12 }}>
                    {config.description}
                  </div>
                )}
              </>
            );
          })()}
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
                disabled={!canSubmit}
                loading={createTaskMutation.isPending}
                onClick={async () => {
                  try {
                    await form.validateFields();
                    // Очищаем предыдущие результаты перед новой отправкой
                    setTaskResp(undefined);
                    setTaskResult(undefined);
                    const values = form.getFieldsValue();
                    const task = toNewDeviceTaskRequest(values);
                    const resp = await createTaskMutation.mutateAsync(task);
                    setTaskResp(resp);
                    message.success('Задача отправлена');
                  } catch (e) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const err = e as any;
                    let errorMsg = 'Не удалось отправить задачу';
                    if (err.response?.data?.message) {
                      errorMsg = err.response.data.message;
                    } else if (err.response?.data?.error) {
                      errorMsg = String(err.response.data.error);
                    } else if (err.message) {
                      errorMsg = err.message;
                    }
                    message.error(errorMsg);
                  }
                }}
              >
                Отправить задачу
              </Button>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                disabled={!canGetResult}
                loading={getTaskResultMutation.isPending}
                onClick={async () => {
                  if (!taskResp?.id) {
                    message.warning('Сначала отправьте задачу (нет id)');
                    return;
                  }
                  try {
                    const result = await getTaskResultMutation.mutateAsync(taskResp.id.toString());
                    setTaskResult(result);
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
                  background: serverResponseBlink ? '#e6f7ff' : '#f5f5f5',
                  transition: 'background-color 0.3s ease',
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


