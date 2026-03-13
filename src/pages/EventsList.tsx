// src/pages/EventsList.tsx
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Switch, Tag, Typography } from "antd"; // ← добавлен Typography
import { useState } from "react";
import { axiosPrivate } from "../common/httpPrivate";

// Типы

// Рекурсивный тип для JSON-объекта
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };

// Поля события из API
type DeviceEventItem = {
  id: number;
  device_id: number;
  event_type_code: number;
  dev_event_id: number;
  created_at: string;
  dev_timestamp: string;
  payload: JsonObject;
};

// Данные для таблицы
type TableListEvent = {
  createdAtRange?: number[];
  createdAt: string;
  event_code: number;
  dev_event_id: number;
  code: JsonObject;
  description?: string;
};

type EventListProps = {
  device_id: string;
};

// Функция формирования описания события
const getEventDescription = (item: TableListEvent): string => {
  const { event_code, code: payload } = item;

  if (!payload || typeof payload !== "object") {
    return "—";
  }

  if (typeof payload["200"] === "number" && payload["200"] === 0) {
    return "Старт устройства";
  }

  switch (event_code) {
    case 44:
      return "Пинг";
    case 45:
      return "Кнопка";
    case 3: {
      const entries = payload["300"];
      if (Array.isArray(entries) && entries.length > 0) {
        const first = entries[0];
        if (first && typeof first === "object" && "301" in first) {
          const card = (first as JsonObject)["301"];
          if (typeof card === "string" || typeof card === "number") {
            return `Карта/пинкод = ${card}`;
          }
        }
      }
      return "—";
    }
    case 14:
    case 13: {
      const entries = payload["300"];
      if (Array.isArray(entries) && entries.length > 0) {
        const first = entries[0];
        if (first && typeof first === "object") {
          const board = (first as JsonObject)["305"];
          const port = (first as JsonObject)["306"];

          const hasBoard = typeof board === "number";
          const hasPort = typeof port === "number";

          if (!hasBoard && !hasPort) {
            return "—";
          }

          const action = event_code === 14 ? "Закрыли" : "Открыли";
          return `${action} замок, плата = ${hasBoard ? board : "?"}, порт = ${hasPort ? port : "?"}`;
        }
      }
      return "—";
    }
    default:
      return `Код ${event_code}`;
  }
};

// Основной компонент
const EventList: React.FC<EventListProps> = ({ device_id }) => {
  const [viewMode, setViewMode] = useState<"compact" | "full">("compact");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [pageData, setPageData] = useState<TableListEvent[]>([]);

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

  const columns: ProColumns<TableListEvent>[] = [
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
    <ProTable<TableListEvent>
      headerTitle="События"
      tooltip="Код определяет суть события и состав данных"
      expandable={{
        expandedRowRender: (record) => (
          <pre style={{ margin: 0, width: "100%", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#000" }}>
            {JSON.stringify(record.code, null, 2)}
          </pre>
        ),
        expandedRowKeys,
        onExpandedRowsChange: (keys) => {
          setExpandedRowKeys(keys as string[]);
        },
      }}
      columns={columns}
      request={async (params) => {
        console.log("Params:", params);

        const response = await axiosPrivate.get<{ items: DeviceEventItem[]; total: number }>("/api/v1/device-events/", {
          params: {
            events_exclude: 44,
            device_id,
            page: params.current,
            size: params.pageSize,
          },
        });

        const eventItems: TableListEvent[] = response.data.items.map((item) => ({
          createdAt: item.created_at,
          dev_event_id: item.dev_event_id,
          event_code: item.event_type_code,
          code: item.payload,
        }));

        return {
          data: eventItems,
          total: response.data.total,
          success: true,
        };
      }}
      onLoad={(data) => {
        const items = data as TableListEvent[];
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