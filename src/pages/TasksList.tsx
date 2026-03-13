// src/pages/TasksList.tsx
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import {
  Tag,
  Typography,
  Spin,
  Button,
  Tooltip,

} from 'antd';
import {
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import NewTask from './CreateNewTask';
import { axiosPrivate } from '../common/httpPrivate';

import { useState, type Key } from 'react';

const { Text: AntText, Paragraph: AntParagraph } = Typography;

// Тип для строки таблицы
type TableListTask = {
  created_at: string;
  method_code: number;
  priority: number;
  ttl_minutes: number;
  status: number;
  task_id: string;
};

// Тип для детального ответа (с header)
type ApiDeviceTaskResponse = {
  id: string;
  created_at: number | string;
  status: number;
  header?: {
    ext_task_id: string;
    method_code: number;
    priority: number;
    ttl: number;
  };
  results?: Array<{
    ext_id: number;
    id: number;
    status_code: number;
    result: Record<string, unknown>;
  }>;
};

// Тип для полной информации о задаче
type FullTaskDetail = {
  id: string;
  created_at: string;
  status: number;
  ext_task_id: string;
  method_code: number;
  priority: number;
  ttl_minutes: number;
  result?: Record<string, unknown>;
  allResults?: Array<{
    ext_id: number;
    id: number;
    status_code: number;
    result: Record<string, unknown>;
  }>;
};

type DetailListProps = {
  device_id: string;
};

// Универсальная функция форматирования даты
const formatTimestamp = (ts: unknown): string => {
  try {
    if (typeof ts === 'number' && !isNaN(ts) && ts > 0) {
      // Если это timestamp в секундах
      return new Date(ts * 1000).toLocaleString('ru-RU');
    }
    if (typeof ts === 'string' && ts.trim() !== '') {
      // Если ISO-строка (например, "2026-03-13T10:59:36.594Z")
      const date = new Date(ts);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('ru-RU');
      }
    }
    console.warn('Некорректная дата:', ts);
    return '—';
  } catch (e) {
    console.error('Ошибка парсинга даты:', e, ts);
    return '—';
  }
};

// Безопасное получение числа
const getNumber = (value: unknown, fallback: number = -1): number => {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
};

const DetailList: React.FC<DetailListProps> = ({ device_id }) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<Key[]>([]);
  const [loadingRows, setLoadingRows] = useState<Record<string, boolean>>({});
  const [taskDetails, setTaskDetails] = useState<Record<string, FullTaskDetail>>({});

  // --- Функция для отображения статуса с иконкой и подсказкой ---
  const getStatusTag = (status: number): React.ReactNode => {
    switch (status) {
      case 0: // READY
        return (
          <Tooltip title="Готова к выполнению">
            <Tag icon={<SyncOutlined spin />} color="gold">
              В процессе
            </Tag>
          </Tooltip>
        );
      case 1: // PENDING
        return (
          <Tooltip title="Ожидает выполнения">
            <Tag icon={<ClockCircleOutlined spin />} color="gold">
              В процессе
            </Tag>
          </Tooltip>
        );
      case 2: // LOCK
        return (
          <Tooltip title="Выполняется">
            <Tag icon={<SyncOutlined spin />} color="gold">
              В процессе
            </Tag>
          </Tooltip>
        );
      case 3: // DONE
        return (
          <Tooltip title="Задача выполнена">
            <Tag icon={<CheckCircleOutlined />} color="green">
              Выполнено
            </Tag>
          </Tooltip>
        );
      case 4: // EXPIRED
        return (
          <Tooltip title="Время выполнения истекло">
            <Tag icon={<ClockCircleOutlined />} color="orange">
              Таймаут
            </Tag>
          </Tooltip>
        );
      case 5: // DELETED
        return (
          <Tooltip title="Задача удалена">
            <Tag icon={<DeleteOutlined />} color="default">
              Удалена
            </Tag>
          </Tooltip>
        );
      case 6: // FAILED
        return (
          <Tooltip title="Выполнение завершилось с ошибкой">
            <Tag icon={<CloseCircleOutlined />} color="red">
              Ошибка
            </Tag>
          </Tooltip>
        );
      case 7: // UNDEFINED
        return (
          <Tooltip title="Статус неизвестен">
            <Tag icon={<QuestionCircleOutlined />} color="default">
              Неизвестно
            </Tag>
          </Tooltip>
        );
      default:
        return (
          <Tooltip title="Неизвестный статус">
            <Tag color="default">—</Tag>
          </Tooltip>
        );
    }
  };

  const loadTaskDetail = async (taskId: string, poll = false) => {
    if (loadingRows[taskId]) return;

    setLoadingRows((prev) => ({ ...prev, [taskId]: true }));

    try {
      const response = await axiosPrivate.get<ApiDeviceTaskResponse>(`/api/v1/device-tasks/${taskId}`);
      const data = response.data;

      if (!data) {
        throw new Error('Пустой ответ от сервера');
      }

      console.log('Детали задачи:', taskId, data);

      const detail: FullTaskDetail = {
        id: data.id,
        created_at: formatTimestamp(data.created_at),
        status: getNumber(data.status, -1),
        ext_task_id: data.header?.ext_task_id ?? '—',
        method_code: getNumber(data.header?.method_code, -1),
        priority: getNumber(data.header?.priority, 0),
        ttl_minutes: Math.ceil(getNumber(data.header?.ttl, 0) / 60),
      };

      if (data.results && data.results.length > 0) {
        detail.allResults = data.results;
        detail.result = data.results[0].result;
      }

      setTaskDetails((prev) => ({
        ...prev,
        [taskId]: detail,
      }));

      // Автообновление, если статус ≠ 3
      if (data.status === 3 || !poll) return;

      const interval = setInterval(async () => {
        try {
          const pollResp = await axiosPrivate.get<ApiDeviceTaskResponse>(`/api/v1/device-tasks/${taskId}`);
          const pollData = pollResp.data;

          const updatedDetail: FullTaskDetail = {
            id: pollData.id,
            created_at: formatTimestamp(pollData.created_at),
            status: getNumber(pollData.status, -1),
            ext_task_id: pollData.header?.ext_task_id ?? '—',
            method_code: getNumber(pollData.header?.method_code, -1),
            priority: getNumber(pollData.header?.priority, 0),
            ttl_minutes: Math.ceil(getNumber(pollData.header?.ttl, 0) / 60),
          };

          if (pollData.results && pollData.results.length > 0) {
            updatedDetail.allResults = pollData.results;
            updatedDetail.result = pollData.results[0].result;
          }

          setTaskDetails((prev) => ({
            ...prev,
            [taskId]: updatedDetail,
          }));

          if (pollData.status === 3) {
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Polling failed:', err);
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Failed to load task detail:', error);
      setTaskDetails((prev) => ({
        ...prev,
        [taskId]: {
          id: taskId,
          created_at: '—',
          status: -1,
          ext_task_id: '—',
          method_code: -1,
          priority: 0,
          ttl_minutes: 0,
        },
      }));
    } finally {
      setLoadingRows((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }
  };

  // Колонки таблицы — с исправленной сигнатурой render
  const columns: ProColumns<TableListTask>[] = [
    {
      title: 'Дата/время',
      key: 'created_at',
      dataIndex: 'created_at',
      width: '30%',
      render: (dom, record) => (
        <Typography.Text style={{ color: '#000', display: 'block' }}>
          {dom || '—'}
        </Typography.Text>
      ),
    },
    {
      title: 'Статус',
      key: 'status',
      width: 80,
      dataIndex: 'status',
      render: (dom, record) => getStatusTag(record.status),
    },
    {
      title: 'Код команды',
      key: 'method_code',
      width: 100,
      dataIndex: 'method_code',
      render: (dom, record) => (
        <Typography.Text style={{ color: '#000' }}>
          <Tag color="blue">{record.method_code}</Tag>
        </Typography.Text>
      ),
    },
    {
      title: 'Приоритет',
      key: 'priority',
      width: 90,
      dataIndex: 'priority',
      render: (dom, record) => (
        <Typography.Text style={{ color: '#000' }}>
          <Tag color="orange">{record.priority}</Tag>
        </Typography.Text>
      ),
    },
    {
      title: 'TTL (мин)',
      key: 'ttl_minutes',
      width: 80,
      dataIndex: 'ttl_minutes',
      render: (dom, record) => (
        <Typography.Text style={{ color: '#000' }}>
          <AntText code>{record.ttl_minutes}</AntText>
        </Typography.Text>
      ),
    },
  ];

  return (
    <ProTable<TableListTask>
      headerTitle="Список заданий (команд)"
      tooltip="Код определяет суть задания и состав данных"
      expandable={{
        expandedRowRender: (record) => {
          const detail = taskDetails[record.task_id];

          if (loadingRows[record.task_id]) {
            return (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Spin size="small" /> Загрузка деталей...
              </div>
            );
          }

          if (!detail) {
            return (
              <div style={{ padding: '16px' }}>
                <Button size="small" onClick={() => loadTaskDetail(record.task_id, true)}>
                  Загрузить полные данные
                </Button>
              </div>
            );
          }

          return (
            <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', maxWidth: '800px' }}>
              <AntParagraph>
                <AntText strong>ID задачи: </AntText>
                <AntText code copyable>{detail.id}</AntText>
              </AntParagraph>

              <AntParagraph>
                <AntText strong>Ext ID: </AntText>
                <AntText>{detail.ext_task_id}</AntText>
              </AntParagraph>

              <AntParagraph>
                <AntText strong>Метод: </AntText>
                <Tag color="blue">{detail.method_code}</Tag>
              </AntParagraph>

              <AntParagraph>
                <AntText strong>Приоритет: </AntText>
                <Tag color="orange">{detail.priority}</Tag>
              </AntParagraph>

              <AntParagraph>
                <AntText strong>TTL: </AntText>
                <AntText>{detail.ttl_minutes} мин</AntText>
              </AntParagraph>

              <AntParagraph>
                <AntText strong>Статус: </AntText>
                {getStatusTag(detail.status)}
              </AntParagraph>

              <AntParagraph>
                <AntText strong>Создана: </AntText>
                <AntText>{detail.created_at}</AntText>
              </AntParagraph>

              <AntParagraph>
                <Button
                  size="small"
                  loading={loadingRows[record.task_id]}
                  onClick={() => loadTaskDetail(record.task_id, false)}
                >
                  Обновить
                </Button>
              </AntParagraph>

              {detail.allResults && detail.allResults.length > 0 && (
                <AntParagraph>
                  <AntText strong>Результаты выполнения:</AntText>
                  <pre
                    style={{
                      margin: '8px 0',
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      maxHeight: 400,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#000',
                    }}
                  >
                    {JSON.stringify(detail.allResults, null, 2)}
                  </pre>
                </AntParagraph>
              )}
            </div>
          );
        },
        onExpand: async (expanded, record) => {
          if (expanded && !taskDetails[record.task_id] && record.task_id) {
            await loadTaskDetail(record.task_id, true);
          }
        },
        expandedRowKeys,
        onExpandedRowsChange: (keys) => {
          setExpandedRowKeys([...keys]);
        },
      }}
      columns={columns}
      request={async (params) => {
        try {
          const response = await axiosPrivate.get<{
            items: Array<{
              id: string;
              created_at: string;
              status: number;
              method_code: number;
              priority: number;
              ttl: number;
            }>;
            total: number;
          }>('/api/v1/device-tasks/', {
            params: {
              device_id,
              page: params.current,
              size: params.pageSize || 10,
            },
          });

          const taskItems: TableListTask[] = response.data.items.map((c) => ({
            created_at: formatTimestamp(c.created_at),
            method_code: getNumber(c.method_code, -1),
            priority: getNumber(c.priority, 0),
            ttl_minutes: Math.ceil(getNumber(c.ttl, 0) / 60),
            status: getNumber(c.status, -1),
            task_id: c.id,
          }));

          return {
            data: taskItems,
            total: response.data.total,
            success: true,
          };
        } catch (error) {
          console.error('Failed to load tasks:', error);
          return {
            data: [],
            total: 0,
            success: false,
            errorMessage: 'Не удалось загрузить список задач',
          };
        }
      }}
      rowKey="task_id"
      search={false}
      pagination={{
        pageSize: 10,
        showSizeChanger: false,
      }}
      toolBarRender={() => [<NewTask device_id={device_id} key="new-task" />]}
      style={{ background: '#fff' }} // ← светлый фон
    />
  );
};

export default DetailList;