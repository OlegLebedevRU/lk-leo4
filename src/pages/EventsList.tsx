// src/pages/EventsList.tsx
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Switch, Tag, Typography } from "antd"; // ← добавлен Typography
import { useState } from "react";
import { fetchEvents } from "../features/events/api/events";
import { mapEventsToListItems, getEventDescription } from "../features/events/domain/eventMapping";
import type { EventListItem } from "../features/events/types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type EventListProps = {
  device_id: string;
};

// Основной компонент
const EventList: React.FC<EventListProps> = ({ device_id }) => {
  const [viewMode, setViewMode] = useState<"compact" | "full">("compact");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [pageData, setPageData] = useState<EventListItem[]>([]);

  const isCompactView = viewMode === "compact";

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
      renderText: (value: string) => {
        if (!value) return "—";

        const date = new Date(value);
        if (isNaN(date.getTime())) {
          const [main] = value.split(".");
          return main;
        }
        return date.toLocaleString("ru-RU", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      },
      // Явно контролируем отображение
      render: (_, record) => (
        <Typography.Text style={{ color: "#000", display: "block" }}>
          {record.createdAt ? new Date(record.createdAt).toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) : "—"}
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

  return (
    <ProTable<EventListItem>
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
    maxHeight: '300px', // Ограничение высоты для длинных JSON
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
        console.log("Params:", params);

        const response = await fetchEvents(device_id, {
          page: params.current,
          size: params.pageSize,
        });

        const eventItems: EventListItem[] = mapEventsToListItems(response.items);

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
      }}
      rowKey="createdAt"
      search={false}
      // Гарантируем светлый фон
      style={{ background: "#fff" }}
    />
  );
};

export default EventList;