import {
  App,
  Button,
  Input,
  InputNumber,
  Select,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CaretRightOutlined,
  ClearOutlined,
  CloseOutlined,
  CloudDownloadOutlined,
  CopyOutlined,
  ColumnWidthOutlined,
  DisconnectOutlined,
  LinkOutlined,
  PauseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDiagnosticsWebSocket,
  sendDiagnosticsMessage,
} from '../services/diagnosticsWebSocket';
import type {
  BackendDiagnosticsMessage,
  DevicePlatform,
  DiagnosticsCommandId,
  DiagnosticsLogLevel,
} from '../types/diagnostics';
import {
  COMMAND_GROUPS,
  type DiagnosticCommandDef,
  getCommandsForPlatform,
  getCommandById,
} from '../domain/diagnosticCommands';

const DEFAULT_STREAM = 'esp32-log';
const DEFAULT_TTL_SEC = 300;
const DEFAULT_MAX_RATE_BPS = 8192;
const MAX_CONSOLE_LINES = 5000;
const DEFAULT_EXEC_TTL_SEC = 60;

type DeviceConsoleTabProps = {
  sn?: string | number | null;
  app?: string | number | null;
};

type ConsoleState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'starting'
  | 'streaming'
  | 'stopping'
  | 'error';

type ConsoleLineKind = 'log' | 'stdout' | 'stderr' | 'status' | 'result' | 'error' | 'system' | 'command';

type ConsoleLine = {
  id: number;
  kind: ConsoleLineKind;
  ts: string;
  text: string;
};

const STATE_LABELS: Record<ConsoleState, string> = {
  disconnected: 'Отключено',
  connecting: 'Подключение...',
  connected: 'Подключено',
  starting: 'Запуск...',
  streaming: 'Идёт поток',
  stopping: 'Остановка...',
  error: 'Ошибка',
};

const STATE_COLORS: Record<ConsoleState, string> = {
  disconnected: 'default',
  connecting: 'processing',
  connected: 'blue',
  starting: 'processing',
  streaming: 'success',
  stopping: 'warning',
  error: 'error',
};

const LOG_LEVEL_OPTIONS: { label: string; value: DiagnosticsLogLevel }[] = [
  { label: 'debug', value: 'debug' },
  { label: 'info', value: 'info' },
  { label: 'warning', value: 'warning' },
  { label: 'error', value: 'error' },
];

const PLATFORM_OPTIONS: { label: string; value: DevicePlatform }[] = [
  { label: 'Все', value: 'any' },
  { label: 'ESP32', value: 'esp32' },
  { label: 'Linux', value: 'linux' },
  { label: 'Windows', value: 'windows' },
];

function isBackendDiagnosticsMessage(value: unknown): value is BackendDiagnosticsMessage {
  if (!value || typeof value !== 'object' || !('type' in value)) {
    return false;
  }
  const messageType = (value as { type?: unknown }).type;
  return messageType === 'output' || messageType === 'status' || messageType === 'error';
}

function getOutputText(message: Extract<BackendDiagnosticsMessage, { type: 'output' }>): string {
  if (message.encoding === 'base64') {
    return '[base64 chunk]';
  }
  return message.data;
}

function formatConsoleTimestamp(ts?: string | null): string {
  return ts || new Date().toISOString();
}

function splitConsoleText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.length > 0 ? lines : [''];
}

const DeviceConsoleTab: React.FC<DeviceConsoleTabProps> = ({ sn, app }) => {
  const { message } = App.useApp();
  const [consoleState, setConsoleState] = useState<ConsoleState>('disconnected');
  const [logLevel, setLogLevel] = useState<DiagnosticsLogLevel>('debug');
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bytesReceived, setBytesReceived] = useState(0);
  const [platform, setPlatform] = useState<DevicePlatform>('any');
  const [executingCommand, setExecutingCommand] = useState<DiagnosticsCommandId | null>(null);
  const [commandArgs, setCommandArgs] = useState<Record<string, string | number | boolean>>({});
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lineSeqRef = useRef(0);
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const isManualCloseRef = useRef(false);

  const snString = useMemo(() => (sn == null ? '' : String(sn).trim()), [sn]);

  // Auto-detect platform from app tag
  useEffect(() => {
    if (app) {
      const appStr = String(app).toLowerCase();
      if (appStr.includes('esp32') || appStr.includes('esp')) {
        setPlatform('esp32');
      } else if (appStr.includes('linux') || appStr.includes('ubuntu') || appStr.includes('debian') || appStr.includes('rpi')) {
        setPlatform('linux');
      } else if (appStr.includes('win') || appStr.includes('windows')) {
        setPlatform('windows');
      }
    }
  }, [app]);

  const filteredCommands = useMemo(() => getCommandsForPlatform(platform), [platform]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, DiagnosticCommandDef[]> = {};
    for (const cmd of filteredCommands) {
      const group = cmd.group;
      if (!groups[group]) groups[group] = [];
      groups[group].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  const updateState = useCallback((nextState: ConsoleState) => {
    setConsoleState(nextState);
  }, []);

  const appendLine = useCallback((kind: ConsoleLineKind, text: string, ts?: string | null) => {
    const nextLines = splitConsoleText(text).map((line) => {
      lineSeqRef.current += 1;
      return {
        id: lineSeqRef.current,
        kind,
        ts: formatConsoleTimestamp(ts),
        text: line,
      };
    });

    setLines((currentLines) => {
      const mergedLines = [...currentLines, ...nextLines];
      return mergedLines.length > MAX_CONSOLE_LINES
        ? mergedLines.slice(mergedLines.length - MAX_CONSOLE_LINES)
        : mergedLines;
    });
  }, []);

  const saveSessionId = useCallback((nextSessionId?: string | null) => {
    if (!nextSessionId || sessionIdRef.current === nextSessionId) return;
    sessionIdRef.current = nextSessionId;
    setSessionId(nextSessionId);
  }, []);

  const sendStopLog = useCallback((writeConsoleLine = true) => {
    const ws = wsRef.current;
    const currentSessionId = sessionIdRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !currentSessionId) return false;

    sendDiagnosticsMessage(ws, {
      type: 'stop_log',
      session_id: currentSessionId,
      stream: DEFAULT_STREAM,
    });

    if (writeConsoleLine) {
      appendLine('system', `stop_log отправлен для session_id=${currentSessionId}`);
    }
    return true;
  }, [appendLine]);

  const sendCancelExec = useCallback((execSessionId: string, reason = 'user_cancel') => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    sendDiagnosticsMessage(ws, {
      type: 'cancel',
      session_id: execSessionId,
      reason,
    });

    appendLine('system', `cancel отправлен для session_id=${execSessionId}`);
    return true;
  }, [appendLine]);

  const closeSocket = useCallback((reason: string, removeListeners = false) => {
    const ws = wsRef.current;
    isManualCloseRef.current = true;

    if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
      if (removeListeners) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
      }
      ws.close(1000, reason);
    }
    wsRef.current = null;
  }, []);

  const handleBackendMessage = useCallback(
    (messageData: string) => {
      let parsed: unknown;

      try {
        parsed = JSON.parse(messageData);
      } catch {
        appendLine('error', `Некорректный JSON от backend: ${messageData}`);
        updateState('error');
        return;
      }

      if (!isBackendDiagnosticsMessage(parsed)) {
        appendLine('error', `Неизвестное сообщение диагностики: ${messageData}`);
        return;
      }

      if (parsed.type === 'output') {
        saveSessionId(parsed.session_id);
        updateState('streaming');
        const outputText = getOutputText(parsed);
        setBytesReceived((currentBytes) => currentBytes + outputText.length);
        appendLine(parsed.kind, outputText, parsed.ts);

        if (parsed.truncated) {
          appendLine('status', 'Вывод был обрезан (truncated)', parsed.ts);
        }

        if (parsed.eof) {
          const exitInfo = parsed.exit_code != null ? `, exit_code=${parsed.exit_code}` : '';
          appendLine('status', `Поток завершён${exitInfo}`, parsed.ts);
          setExecutingCommand(null);
        }
        return;
      }

      if (parsed.type === 'status') {
        saveSessionId(parsed.session_id);
        appendLine('status', `status: ${parsed.status}`, null);
        updateState(parsed.status === 'started' || parsed.status === 'running' ? 'streaming' : 'connected');
        return;
      }

      saveSessionId(parsed.session_id);
      appendLine('error', parsed.error);
      updateState('error');
      setExecutingCommand(null);
      message.error(parsed.error);
    },
    [appendLine, message, saveSessionId, updateState],
  );

  // ── WebSocket connect / disconnect ─────────────────────────

  const ensureConnected = useCallback((): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return true;
    if (!snString) {
      message.warning('Выберите устройство с serial number');
      return false;
    }

    sessionIdRef.current = null;
    setSessionId(null);
    isManualCloseRef.current = false;
    updateState('connecting');
    appendLine('system', `Подключение к диагностике устройства SN=${snString}`);

    const ws = createDiagnosticsWebSocket(snString);
    wsRef.current = ws;

    ws.onopen = () => {
      updateState('connected');
      appendLine('status', 'WebSocket подключён');
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        handleBackendMessage(event.data);
      } else {
        appendLine('error', 'Получено бинарное WebSocket сообщение (не поддерживается)');
      }
    };

    ws.onerror = () => {
      appendLine('error', 'Ошибка WebSocket соединения');
      updateState('error');
      message.error('Ошибка WebSocket соединения');
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      sessionIdRef.current = null;
      setSessionId(null);
      setExecutingCommand(null);
      appendLine(
        isManualCloseRef.current ? 'status' : 'error',
        `WebSocket закрыт: code=${event.code}${event.reason ? `, reason=${event.reason}` : ''}`,
      );
      updateState(isManualCloseRef.current ? 'disconnected' : 'error');
      isManualCloseRef.current = false;
    };

    return true;
  }, [appendLine, handleBackendMessage, message, snString, updateState]);

  // ── Start live logs ────────────────────────────────────────

  const handleStartLogs = useCallback(() => {
    if (!ensureConnected()) return;

    const doStart = () => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      updateState('starting');
      appendLine('status', 'Отправка start_log');
      sendDiagnosticsMessage(ws, {
        type: 'start_log',
        level: logLevel,
        stream: DEFAULT_STREAM,
        ttl_sec: DEFAULT_TTL_SEC,
        max_rate_bps: DEFAULT_MAX_RATE_BPS,
      });
    };

    // If already connected, start immediately; otherwise wait for onopen
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      doStart();
    } else {
      // Override onopen for this flow
      const origOnOpen = wsRef.current?.onopen;
      if (wsRef.current) {
        wsRef.current.onopen = () => {
          if (origOnOpen) origOnOpen.call(wsRef.current!, new Event('open'));
          doStart();
        };
      }
    }
  }, [appendLine, ensureConnected, logLevel, updateState]);

  const handleStopLogs = useCallback(() => {
    if (!sessionIdRef.current) {
      message.info('Остановка доступна после получения session_id');
      return;
    }
    updateState('stopping');
    sendStopLog();
    closeSocket('stop_log sent');
  }, [closeSocket, message, sendStopLog, updateState]);

  // ── Execute diagnostic command ─────────────────────────────

  const handleExecCommand = useCallback(
    (commandId: DiagnosticsCommandId) => {
      if (!ensureConnected()) return;

      const ws = wsRef.current;
      if (!ws) return;

      const doExec = () => {
        const activeWs = wsRef.current;
        if (!activeWs || activeWs.readyState !== WebSocket.OPEN) return;

        const cmdDef = getCommandById(commandId);
        const args: Record<string, unknown> = {};
        if (cmdDef?.args) {
          for (const arg of cmdDef.args) {
            const val = commandArgs[arg.key];
            if (val !== undefined && val !== '') {
              args[arg.key] = val;
            } else if (arg.defaultValue !== undefined) {
              args[arg.key] = arg.defaultValue;
            }
          }
        }

        setExecutingCommand(commandId);
        appendLine('command', `>>> ${commandId}${Object.keys(args).length > 0 ? ' ' + JSON.stringify(args) : ''}`);

        sendDiagnosticsMessage(activeWs, {
          type: 'exec',
          command_id: commandId,
          args,
          ttl_sec: DEFAULT_EXEC_TTL_SEC,
        });
      };

      if (ws.readyState === WebSocket.OPEN) {
        doExec();
      } else {
        const origOnOpen = ws.onopen;
        ws.onopen = () => {
          if (origOnOpen) origOnOpen.call(ws, new Event('open'));
          doExec();
        };
      }
    },
    [appendLine, commandArgs, ensureConnected],
  );

  const handleCancelExec = useCallback(() => {
    if (!sessionIdRef.current) return;
    sendCancelExec(sessionIdRef.current);
    setExecutingCommand(null);
  }, [sendCancelExec]);

  // ── Utility ────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setLines([]);
    setBytesReceived(0);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = lines.map((line) => `[${line.ts}] ${line.text}`).join('\n');
    await navigator.clipboard.writeText(text);
    message.success('Лог скопирован');
  }, [lines, message]);

  const handleDownload = useCallback(() => {
    const text = lines.map((line) => `[${line.ts}] ${line.text}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnostics-${snString || 'device'}-${new Date().toISOString()}.log`;
    link.click();
    URL.revokeObjectURL(url);
  }, [lines, snString]);

  useEffect(() => {
    if (!autoScroll) return;
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [autoScroll, lines]);

  useEffect(() => {
    return () => {
      sendStopLog(false);
      closeSocket('component unmounted', true);
    };
  }, [closeSocket, sendStopLog]);

  const isConnected = consoleState !== 'disconnected' && consoleState !== 'error';
  const canStartLogs = !!snString && ['disconnected', 'error', 'connected'].includes(consoleState);
  const canStopLogs = !!sessionId && consoleState !== 'stopping' && consoleState !== 'disconnected';

  // ── Command panel ──────────────────────────────────────────

  const [expandedCmd, setExpandedCmd] = useState<DiagnosticsCommandId | null>(null);

  const renderCommandPanel = () => (
    <div className="device-console-cmd-panel">
      {/* Header: title + collapse button */}
      <div className="device-console-cmd-header">
        <ColumnWidthOutlined style={{ fontSize: 13, color: '#8b949e' }} />
        <span className="device-console-cmd-title">Команды</span>
        <Tooltip title="Скрыть панель">
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setPanelCollapsed(true)}
            className="device-console-cmd-collapse-btn"
          />
        </Tooltip>
      </div>

      {/* Platform tabs */}
      <div className="device-console-cmd-platform">
        <Segmented<DevicePlatform>
          size="small"
          block
          value={platform}
          options={PLATFORM_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          onChange={(val) => {
            setPlatform(val);
            setExpandedCmd(null);
          }}
        />
      </div>

      {/* Command list */}
      <div className="device-console-cmd-list">
        {Object.entries(groupedCommands).map(([group, cmds]) => (
          <div key={group} className="device-console-cmd-group">
            <div className="device-console-cmd-group-label">
              {COMMAND_GROUPS[group] || group}
            </div>
            {cmds.map((cmd) => {
              const isExecuting = executingCommand === cmd.id;
              const isExpanded = expandedCmd === cmd.id;
              const hasArgs = cmd.args && cmd.args.length > 0;
              const isDisabled = !!executingCommand && !isExecuting;

              return (
                <div
                  key={cmd.id}
                  className={`device-console-cmd-item${isExecuting ? ' device-console-cmd-item--active' : ''}${isExpanded ? ' device-console-cmd-item--expanded' : ''}${isDisabled ? ' device-console-cmd-item--disabled' : ''}`}
                >
                  <div
                    className="device-console-cmd-row"
                    onClick={() => {
                      if (isDisabled) return;
                      if (hasArgs && !isExecuting) {
                        setExpandedCmd(isExpanded ? null : cmd.id);
                      } else {
                        if (isExecuting) {
                          handleCancelExec();
                        } else {
                          handleExecCommand(cmd.id);
                        }
                      }
                    }}
                  >
                    <span className={`device-console-cmd-indicator${isExecuting ? ' device-console-cmd-indicator--pulse' : ''}`} />
                    <span className="device-console-cmd-label">{cmd.label}</span>
                    {cmd.platform !== 'any' && (
                      <span className={`device-console-cmd-platform-dot device-console-cmd-platform-dot--${cmd.platform}`} />
                    )}
                    {hasArgs && !isExecuting && (
                      <span className="device-console-cmd-expand-hint">
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    )}
                    {isExecuting && (
                      <Tooltip title="Остановить">
                        <Button
                          type="text"
                          size="small"
                          icon={<PauseCircleOutlined />}
                          onClick={(e) => { e.stopPropagation(); handleCancelExec(); }}
                          className="device-console-cmd-stop-btn"
                        />
                      </Tooltip>
                    )}
                  </div>

                  {/* Inline args */}
                  {isExpanded && hasArgs && !isExecuting && (
                    <div className="device-console-cmd-args">
                      {cmd.args!.map((arg) => (
                        <div key={arg.key} className="device-console-cmd-arg">
                          <label className="device-console-cmd-arg-label">{arg.label}</label>
                          {arg.type === 'number' ? (
                            <InputNumber
                              size="small"
                              value={commandArgs[arg.key] as number ?? arg.defaultValue}
                              onChange={(val) => setCommandArgs((prev) => ({ ...prev, [arg.key]: val ?? '' }))}
                              className="device-console-cmd-arg-input"
                            />
                          ) : arg.type === 'boolean' ? (
                            <Select
                              size="small"
                              value={commandArgs[arg.key] ?? arg.defaultValue}
                              onChange={(val) => setCommandArgs((prev) => ({ ...prev, [arg.key]: val }))}
                              options={[
                                { label: 'Да', value: true },
                                { label: 'Нет', value: false },
                              ]}
                              className="device-console-cmd-arg-input"
                            />
                          ) : (
                            <Input
                              size="small"
                              value={String(commandArgs[arg.key] ?? arg.defaultValue ?? '')}
                              onChange={(e) => setCommandArgs((prev) => ({ ...prev, [arg.key]: e.target.value }))}
                              placeholder={arg.label}
                              className="device-console-cmd-arg-input"
                            />
                          )}
                        </div>
                      ))}
                      <Button
                        type="primary"
                        size="small"
                        icon={<CaretRightOutlined />}
                        onClick={() => handleExecCommand(cmd.id)}
                        className="device-console-cmd-run-btn"
                      >
                        Выполнить
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────

  return (
    <div className={`device-console-tab ${panelCollapsed ? 'device-console-tab--collapsed' : ''}`}>
      {/* Toolbar */}
      <div className="device-console-toolbar">
        <Space wrap size="small">
          {panelCollapsed && (
            <Tooltip title="Показать панель команд">
              <Button
                size="small"
                icon={<ColumnWidthOutlined />}
                onClick={() => setPanelCollapsed(false)}
              >
                Команды
              </Button>
            </Tooltip>
          )}
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={handleStartLogs}
            disabled={!canStartLogs}
            size="small"
          >
            Live Logs
          </Button>
          <Tooltip title={sessionId ? undefined : 'Остановка доступна после получения session_id'}>
            <Button
              danger
              icon={<DisconnectOutlined />}
              onClick={handleStopLogs}
              disabled={!canStopLogs}
              size="small"
            >
              Стоп
            </Button>
          </Tooltip>
          <Tag color={STATE_COLORS[consoleState]}>{STATE_LABELS[consoleState]}</Tag>
          {executingCommand && (
            <Tag color="processing" icon={<ThunderboltOutlined />}>
              {executingCommand}
            </Tag>
          )}
          <Select<DiagnosticsLogLevel>
            size="small"
            value={logLevel}
            options={LOG_LEVEL_OPTIONS}
            onChange={setLogLevel}
            disabled={isConnected}
            style={{ width: 100 }}
          />
          <Button size="small" icon={<ClearOutlined />} onClick={handleClear}>
            Очистить
          </Button>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={lines.length === 0}>
            Копировать
          </Button>
          <Button size="small" icon={<CloudDownloadOutlined />} onClick={handleDownload} disabled={lines.length === 0}>
            Скачать
          </Button>
          <Button
            size="small"
            type={autoScroll ? 'primary' : 'default'}
            onClick={() => setAutoScroll((c) => !c)}
          >
            Auto-scroll
          </Button>
        </Space>
        <Typography.Text type="secondary" className="device-console-stats">
          SN: {snString || '—'} · строк: {lines.length}/{MAX_CONSOLE_LINES} · байт: {bytesReceived}
        </Typography.Text>
      </div>

      {/* Main area */}
      <div className="device-console-main">
        {/* Command panel (left sidebar) */}
        {!panelCollapsed && renderCommandPanel()}

        {/* Console output */}
        <div ref={consoleRef} className="device-console-output" role="log" aria-live="polite">
          {lines.length === 0 ? (
            <div className="device-console-line device-console-line-system">
              Выберите устройство. Нажмите &laquo;Live Logs&raquo; для запуска потока или выберите команду из панели слева.
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.id} className={`device-console-line device-console-line-${line.kind}`}>
                <span className="device-console-ts">[{line.ts}]</span>
                <span className="device-console-text">{line.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceConsoleTab;
