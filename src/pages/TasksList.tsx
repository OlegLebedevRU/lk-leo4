// src/pages/TasksList.tsx
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import {
  Tag,
  Typography,
  Spin,
  Button,
} from 'antd';
import NewTask from './CreateNewTask';
import { fetchTasks, fetchTaskDetail } from '../features/tasks/api/tasks';
import { mapTasksToListItems, mapApiResponseToFullTaskDetail, } from '../features/tasks/domain/taskMapping';
import { getStatusTag } from '../features/tasks/domain/statusMapping';
import type { TaskListItem, FullTaskDetail } from '../features/tasks/types';
import { useState, type Key } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
const { Text: AntText, Paragraph: AntParagraph } = Typography;

type DetailListProps = {
  device_id: string;
};

const DetailList: React.FC<DetailListProps> = ({ device_id }) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<Key[]>([]);
  const [loadingRows, setLoadingRows] = useState<Record<string, boolean>>({});
  const [taskDetails, setTaskDetails] = useState<Record<string, FullTaskDetail>>({});

  const loadTaskDetail = async (taskId: string, poll = false) => {
    if (loadingRows[taskId]) return;

    setLoadingRows((prev) => ({ ...prev, [taskId]: true }));

    try {
      const data = await fetchTaskDetail(taskId);
      const detail = mapApiResponseToFullTaskDetail(data);

      setTaskDetails((prev) => ({
        ...prev,
        [taskId]: detail,
      }));

      // Автообновление, если статус ≠ 3
      if (data.status === 3 || !poll) return;

      const interval = setInterval(async () => {
        try {
          const pollData = await fetchTaskDetail(taskId);
          const updatedDetail = mapApiResponseToFullTaskDetail(pollData);

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
  const columns: ProColumns<TaskListItem>[] = [
    {
      title: 'Дата/время',
      key: 'created_at',
      dataIndex: 'created_at',
      width: '30%',
     render: (dom) => (
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
      render: (_dom, record) => getStatusTag(record.status),
    },
    {
      title: 'Код команды',
      key: 'method_code',
      width: 100,
      dataIndex: 'method_code',
      render: (_dom, record) => (
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
      render: (_dom, record) => (
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
      render: (_dom, record) => (
        <Typography.Text style={{ color: '#000' }}>
          <AntText code>{record.ttl_minutes}</AntText>
        </Typography.Text>
      ),
    },
  ];

  return (
    <ProTable<TaskListItem>
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
                  <SyntaxHighlighter
  language="json"
  style={vs}
  customStyle={{
    margin: '8px 0',
    padding: '12px',
    backgroundColor: '#f5f5f5', // Совпадает с вашим стилем
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '13px',
    lineHeight: 1.5,
    maxHeight: 400,
    overflow: 'auto',
  }}
>
  {JSON.stringify(detail.allResults, null, 2)}
</SyntaxHighlighter>
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
          const response = await fetchTasks(device_id, {
            page: params.current,
            size: params.pageSize || 10,
          });

          const taskItems: TaskListItem[] = mapTasksToListItems(response.items);

          return {
            data: taskItems,
            total: response.total,
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