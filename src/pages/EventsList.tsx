// src/pages/EventsList.tsx
import { ProTable, type ProColumns, type ActionType } from "@ant-design/pro-components";
import { Switch, Tag, Typography } from "antd";
import { useState, useRef, useEffect, useCallback } from "react";
import { fetchEvents } from "../features/events/api/events";
import { mapEventsToListItems, getEventDescription } from "../features/events/domain/eventMapping";
import type { EventListItem } from "../features/events/types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type EventListProps = {
  device_id: string;
  onRefresh?: (triggerRefresh: () => void) => void;
};

const EventList: React.FC<EventListProps> = ({ device_id, onRefresh }) => {
  const [viewMode, setViewMode] = useState<"compact" | "full">("compact");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [pageData, setPageData] = useState<EventListItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [newEventKeys, setNewEventKeys] = useState<Set<string>>(new Set());
  const actionRef = useRef<ActionType>(null);
  const prevEventIds = useRef<Set<string>>(new Set());

  const isCompactView = viewMode === "compact";

  // Функция для мягкого обновления
  const handleSoftRefresh = useCallback(() => {
    console.log('[EventsList] handleSoftRefresh called, currentPage:', currentPage);
    
    // Обновляем всегда при автообновлении от DeviceList
    // Не проверяем activeTab, чтобы работал авторефреш
    if (currentPage === 1 && actionRef.current) {
      console.log('[EventsList] Calling reload');
      actionRef.current.reload();
    } else {
      console.log('[EventsList] Skipping refresh - conditions not met, currentPage:', currentPage);
    }
  }, [currentPage]);

  // Регистрируем функцию обновления
  useEffect(() => {
    console.log('[EventsList] useEffect called, onRefresh:', !!onRefresh);
    if (onRefresh) {
      console.log('[EventsList] Registering handleSoftRefresh');
      onRefresh(handleSoftRefresh);
    }
  }, [onRefresh, handleSoftRefresh]);

  const handleViewModeChange = (checked: boolean) => {
    const mode: "compact" | "full" = checked ? "compact" : "full";
    setViewMode(mode);
    if (mode === "full") {
      setExpandedRowKeys(pageData.map((item) => item.createdAt));
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
      render: (_, record) => {
        const isNew = newEventKeys.has(record.createdAt);
        return (
          <Typography.Text style={{ 
            color: "#000", 
            display: "block",
            backgroundColor: isNew ? '#fff3cd' : 'transparent',
            padding: isNew ? '2px 4px' : '0',
            borderRadius: isNew ? '2px' : '0',
            transition: 'background-color 0.5s ease',
          }}>
            {record.createdAt ? new Date(record.createdAt).toLocaleString("ru-RU", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }) : "—"}
          </Typography.Text>
        );
      },
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
      request={async (params) => {
        const page = params.current || 1;
        setCurrentPage(page);

        const response = await fetchEvents(device_id, {
          page: page,
          size: params.pageSize,
        });

        const eventItems: EventListItem[] = mapEventsToListItems(response.items);

        // Определяем новые события только для первой страницы
        if (page === 1) {
          const currentIds = new Set(eventItems.map(item => item.createdAt));
          const newIds = new Set<string>();
          
          currentIds.forEach(id => {
            if (!prevEventIds.current.has(id)) {
              newIds.add(id);
            }
          });
          
          if (newIds.size > 0) {
            setNewEventKeys(prev => new Set([...prev, ...newIds]));
          }
          
          prevEventIds.current = currentIds;
          
          // Очищаем подсветку через 60 секунд
          setTimeout(() => {
            setNewEventKeys(prev => {
              const updated = new Set(prev);
              newIds.forEach(id => updated.delete(id));
              return updated;
            });
          }, 60000);
        }

        return {
          data: eventItems,
          total: response.total,
          success: true,
        };
      }}
      onLoad={(data) => {
        const items = data as EventListItem[];
        setPageData(items);
        if (!isCompactView) {
          setExpandedRowKeys(items.map((item) => item.createdAt));
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
      options={{ reload: true }}
      pagination={{
        pageSize: isCompactView ? 10 : 3,
        showSizeChanger: false,
        showLessItems: false,
        showTitle: false,
        showTotal: (total: number) => `Всего: ${total}`,
      }}
      rowKey="createdAt"
      search={false}
      style={{ background: "#fff" }}
    />
  );
};

export default EventList;
