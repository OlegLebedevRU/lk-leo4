// src/pages/EventsList.tsx
import { ProTable, type ProColumns, type ActionType } from "@ant-design/pro-components";
import { Switch, Tag, Typography, Spin, Alert } from "antd";
import { useState, useRef, useCallback } from "react";
import { useEvents } from "../hooks/useEvents";
import { getEventDescription } from "../features/events/domain/eventMapping";
import type { EventListItem } from "../features/events/types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type EventListProps = {
  device_id: string;
  onRefresh?: (triggerRefresh: () => void) => void;
};

const AUTOREFRESH_INTERVAL = 60000; // 1 минута

const EventList: React.FC<EventListProps> = ({ device_id, onRefresh }) => {
  const [viewMode, setViewMode] = useState<"compact" | "full">("compact");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const actionRef = useRef<ActionType>(null);

  const isCompactView = viewMode === "compact";

  // Используем React Query хук
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch,
  } = useEvents(device_id, {
    page: 1,
    size: isCompactView ? 10 : 3,
    refetchInterval: AUTOREFRESH_INTERVAL,
  });

  // Функция для принудительного обновления
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Регистрируем функцию обновления для внешнего вызова
  useRef(() => {
    if (onRefresh) {
      onRefresh(handleRefresh);
    }
  });

  const handleViewModeChange = (checked: boolean) => {
    const mode: "compact" | "full" = checked ? "compact" : "full";
    setViewMode(mode);
    if (mode === "full" && data?.items) {
      setExpandedRowKeys(data.items.map((item) => item.createdAt));
    } else {
      setExpandedRowKeys([]);
    }
  };

  const columns: ProColumns<EventListItem>[] = [
    {
      title: "Дата/время",
      key: "createdAt",
      dataIndex: "createdAt",
      valueType: "text",
      width: "30%",
      render: (_, record) => (
        <Typography.Text style={{ color: "#000", display: "block" }}>
          {record.createdAt
            ? new Date(record.createdAt).toLocaleString("ru-RU", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "—"}
        </Typography.Text>
      ),
    },
    {
      title: "Nпп",
      key: "dev_event_id",
      dataIndex: "dev_event_id",
      valueType: "text",
      render: (value) => (
        <Typography.Text style={{ color: "#000" }}>{value || "—"}</Typography.Text>
      ),
    },
    {
      title: "Код",
      key: "event_code",
      dataIndex: "event_code",
      valueType: "text",
      render: (_, record) => <Tag color="magenta">{record.event_code}</Tag>,
    },
    {
      title: "Описание",
      key: "description",
      dataIndex: "description",
      valueType: "text",
      render: (_, record) => {
        const descr = getEventDescription(record);
        return (
          <Typography.Text strong style={{ color: "#000", display: "block", maxWidth: "32ch" }}>
            {descr}
          </Typography.Text>
        );
      },
    },
  ];

  // Обработка состояний загрузки и ошибки
  if (isLoading && !data) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <Spin size="large" />
        <div style={{ marginTop: 8 }}>Загрузка событий...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        message="Ошибка загрузки событий"
        description={error?.message || "Не удалось загрузить события"}
        type="error"
        showIcon
        action={
          <Switch checked={isCompactView} onChange={handleViewModeChange} />
        }
      />
    );
  }

  return (
    <ProTable<EventListItem>
      actionRef={actionRef}
      headerTitle="События"
      tooltip="Код определяет суть события и состав данных"
      expandable={{
        expandedRowRender: (record) => (
          <SyntaxHighlighter
            language="json"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              width: "100%",
              fontSize: '12px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              padding: '8px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px',
            }}
          >
            {JSON.stringify(record.code, null, 2)}
          </SyntaxHighlighter>
        ),
        expandedRowKeys,
        onExpandedRowsChange: (keys) => {
          setExpandedRowKeys(keys as string[]);
        },
      }}
      columns={columns}
      // Используем data из React Query вместо request
      dataSource={data?.items || []}
      pagination={{
        current: 1,
        pageSize: isCompactView ? 10 : 3,
        total: data?.total || 0,
        showSizeChanger: false,
        showLessItems: false,
        showTitle: false,
        showTotal: (total: number) => `Всего: ${total}`,
      }}
      onLoad={() => {
        // Раскрываем все строки в полном режиме
        if (!isCompactView && data?.items) {
          setExpandedRowKeys(data.items.map((item) => item.createdAt));
        }
      }}
      toolBarRender={() => [
        <Switch
          key="view-mode"
          checked={isCompactView}
          onChange={handleViewModeChange}
          checkedChildren="Кратко"
          unCheckedChildren="Полное"
        />,
      ]}
      options={{
        reload: () => {
          handleRefresh();
          return Promise.resolve();
        },
      }}
      rowKey="createdAt"
      search={false}
      style={{ background: "#fff" }}
    />
  );
};

export default EventList;
