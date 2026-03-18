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
import { useState } from 'react';
import { fetchTaskDetail } from '../features/tasks/api/tasks';
import { buildPacketPreview, generateExtTaskId, submitTask } from '../features/tasks/domain/taskCreation';
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
  const [loadings, setLoadings] = useState<boolean[]>([]);
  const [taskResp, setTaskResp] = useState<{ id: string | number } | undefined>(undefined);
  const [taskResult, setTaskResult] = useState<unknown>(undefined);
  const [dtItems, setDtItems] = useState<Array<{ dt_cd: string; dt_cl: number }>>([{ dt_cd: '', dt_cl: 1 }]);

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
              defaultDtValues.dt_items = [{ dt_cd: '', dt_cl: 1 }];
              setDtItems([{ dt_cd: '', dt_cl: 1 }]);
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
                      defaultValues.dt_items = [{ dt_cd: '', dt_cl: 1 }];
                      setDtItems([{ dt_cd: '', dt_cl: 1 }]);
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
            
            // Для поддержки множественных объектов (method_code=16)
            if (config.supportsMultiple) {
              // Используем useState для управления списком
              const currentItems = form.getFieldValue('dt_items') as Array<{ dt_cd: string; dt_cl: number }> | undefined;
              const items = currentItems && currentItems.length > 0 ? currentItems : dtItems;
              
              return (
                <>
                  {items.map((item, index) => (
                    <ProForm.Group key={index} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                      <ProFormText
                        name={['dt_items', index, 'dt_cd']}
                        label={index === 0 ? 'ID карты/пинкод' : ''}
                        tooltip={index === 0 ? 'ID карты или пинкод (до 6 цифр)' : undefined}
                        placeholder="111111"
                        style={{ width: 140 }}
                        fieldProps={{
                          maxLength: 6,
                          onChange: (e) => {
                            // Обновляем значение в массиве
                            const newItems = [...items];
                            newItems[index] = { ...newItems[index], dt_cd: e.target.value };
                            form.setFieldsValue({ dt_items: newItems });
                          }
                        }}
                      />
                      <ProFormDigit
                        name={['dt_items', index, 'dt_cl']}
                        label={index === 0 ? 'Слот/ячейка' : ''}
                        tooltip={index === 0 ? 'Номер слота/ячейки (1-255)' : undefined}
                        initialValue={item.dt_cl || 1}
                        min={1}
                        max={255}
                        width={80}
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
                      const newItems = [...items, { dt_cd: '', dt_cl: 1 }];
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
                      if (field.type === 'string') {
                        return (
                          <ProFormText
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


