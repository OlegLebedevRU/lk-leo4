import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Switch, Tag } from "antd";
import { useState } from "react";
import { axiosPrivate } from "../common/httpPrivate";

type TableListEvent = {
    createdAtRange?: number[];
    createdAt: string;
    event_code: number;
    dev_event_id: number;
    code: string;
    description?: string;
};

type EventListProps = {
    device_id: string;
};

type EventPayload = {
    [key: string]: unknown;
};

const getEventDescription = (item: TableListEvent): string => {
    if (!item.code) {
        return "-";
    }

    let payload: EventPayload;

    try {
        payload = JSON.parse(item.code) as EventPayload;
    } catch {
        return "-";
    }

    if (payload["200"] === 0) {
        return "Старт устройства";
    }

    switch (item.event_code) {
        case 44:
            return "Пинг";
        case 45:
            return "Кнопка";
        case 3: {
            const card = (payload["300"] as { [key: string]: EventPayload }[] | undefined)?.[0]?.["301"];
            return card !== undefined ? `Карта/пинкод = ${card}` : "-";
        }
        case 14:
        case 13: {
            const board = (payload["300"] as { [key: string]: EventPayload }[] | undefined)?.[0]?.["305"];
            const port = (payload["300"] as { [key: string]: EventPayload }[] | undefined)?.[0]?.["306"];

            if (board === undefined && port === undefined) {
                return "-";
            }

            const action = item.event_code === 14 ? "Закрыли" : "Открыли";
            return `${action} замок, плата = ${board}, порт = ${port}`;
        }
        default:
            return "-";
    }
};

const EventList: React.FC<EventListProps> = (props) => {
    const { device_id } = props;
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
            renderText: (value) => {
                if (!value) {
                    return "";
                }

                const date = new Date(value);

                if (Number.isNaN(date.getTime())) {
                    // fallback: обрежем возможные миллисекунды
                    const [main] = String(value).split(".");
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
        },
        {
            title: "Nпп",
            key: "dev_event_id",
            dataIndex: "dev_event_id",
            valueType: "text",
        },
        {
            title: "Код",
            key: "event_code",
            //   width: 8,
            dataIndex: "event_code",
            valueType: "text",
            render: (_, item) => {
                return (
                    <Tag color="magenta">{item.event_code}</Tag>
                );
            }
        },
        {
            title: "Описание",
            key: "description",
            dataIndex: "description",
            valueType: "text",
            // width: '50%',

            render: (_, item) => {
                const descr = getEventDescription(item);
                return (
                    <p style={{ margin: 0, width: "32ch", font: "bold" }}>{descr}</p>
                );
            }

        },
        //{expandable:EXPAND_COLUMN},
        // {
        //   title: 'Содержание',
        //   key: 'code',
        //   width: 360,
        //   dataIndex: 'code',
        //   valueType: 'jsonCode',
        // //   render:(_, item) => {
        // //     return(
        // //         <Collapse
        // //         size="small"
        // //         items={[{ key: '1', label: `This is ${item.event_code}`, children: <p>{item.code}</p> }]}
        // //         />
        // //     );
        // //   }
        // },
        // {
        //   title: 'Опции',
        //   key: 'option',
        //   width: 80,
        //   valueType: 'option',
        //   render: () => [<a key="a">Подробнее</a>],
        // },
    ];

    return (
        <ProTable<TableListEvent>
            headerTitle="События"
            tooltip="Код определяет суть события и состав данных"
            expandable={{
                expandedRowRender: (record) => (
                    <p style={{ margin: 0, width: 360 }}>{record.code}</p>
                ),
                expandedRowKeys,
                onExpandedRowsChange: (keys) => {
                    setExpandedRowKeys(keys as string[]);
                },
            }}
            columns={columns}
            request={async (params, sorter, filter) => {
                console.log(params, sorter, filter);

                const response = await axiosPrivate.get("/api/v1/device-events/", {
                    params: {
                        events_exclude: 44,
                        device_id,
                        page: params.current,
                        size: params.pageSize,
                    },
                });

                const r = response.data.items;

                const eventItems: TableListEvent[] = r.map((
                    c: {
                        created_at: string;
                        dev_event_id: number;
                        event_type_code: number;
                        payload: string;
                    }
                ) => {
                    return {
                        createdAt: c.created_at,
                        dev_event_id: c.dev_event_id,
                        event_code: c.event_type_code,
                        code: c.payload,
                    };
                });

                return { data: eventItems, total: response.data.total };
            }}
            onLoad={(data) => {
                setPageData(data);
                if (!isCompactView) {
                    setExpandedRowKeys(data.map((item) => item.createdAt));
                }
            }}
            toolBarRender={() => [
                <Switch
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
        />
    );
}

export default EventList