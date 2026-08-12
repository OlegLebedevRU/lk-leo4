import type { DevicePlatform, DiagnosticsCommandId } from '../types/diagnostics';

export type DiagnosticCommandDef = {
  id: DiagnosticsCommandId;
  label: string;
  description: string;
  platform: DevicePlatform;
  group: 'system' | 'network' | 'storage' | 'process' | 'service' | 'logs';
  args?: Array<{
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean';
    defaultValue?: string | number | boolean;
    required?: boolean;
  }>;
};

export const DIAGNOSTIC_COMMANDS: DiagnosticCommandDef[] = [
  // ── Universal ──────────────────────────────────────────────
  {
    id: 'system_info',
    label: 'Информация о системе',
    description: 'Общая информация: ОС, версия ядра, hostname, uptime',
    platform: 'any',
    group: 'system',
  },
  {
    id: 'network_info',
    label: 'Сетевые интерфейсы',
    description: 'IP-адреса, интерфейсы, маршруты',
    platform: 'any',
    group: 'network',
  },
  {
    id: 'disk_usage',
    label: 'Использование дисков',
    description: 'Размер, занятое и свободное пространство',
    platform: 'any',
    group: 'storage',
  },
  {
    id: 'service_status',
    label: 'Статус сервисов',
    description: 'Список сервисов и их состояния',
    platform: 'any',
    group: 'service',
  },

  // ── Linux ──────────────────────────────────────────────────
  {
    id: 'uptime',
    label: 'Uptime',
    description: 'Время работы системы и нагрузка',
    platform: 'linux',
    group: 'system',
  },
  {
    id: 'memory_usage',
    label: 'Память',
    description: 'Использование оперативной памяти и swap',
    platform: 'linux',
    group: 'system',
  },
  {
    id: 'process_list',
    label: 'Процессы',
    description: 'Список запущенных процессов (ps aux)',
    platform: 'linux',
    group: 'process',
  },
  {
    id: 'top_processes',
    label: 'Топ процессов',
    description: 'Процессы с наибольшим потреблением CPU/RAM',
    platform: 'linux',
    group: 'process',
  },
  {
    id: 'journal_logs',
    label: 'Журнал (journalctl)',
    description: 'Последние записи системного журнала',
    platform: 'linux',
    group: 'logs',
    args: [
      { key: 'lines', label: 'Строк', type: 'number', defaultValue: 50 },
      { key: 'unit', label: 'Юнит', type: 'string', defaultValue: '' },
    ],
  },
  {
    id: 'iptables_rules',
    label: 'Правила firewall',
    description: 'Текущие правила iptables/nftables',
    platform: 'linux',
    group: 'network',
  },
  {
    id: 'systemctl_status',
    label: 'Systemd юниты',
    description: 'Статус systemd юнитов',
    platform: 'linux',
    group: 'service',
    args: [
      { key: 'unit', label: 'Юнит', type: 'string', defaultValue: '' },
    ],
  },

  // ── Windows ────────────────────────────────────────────────
  {
    id: 'get_processes',
    label: 'Процессы',
    description: 'Список запущенных процессов (Get-Process)',
    platform: 'windows',
    group: 'process',
  },
  {
    id: 'get_services',
    label: 'Службы',
    description: 'Список служб и их статус (Get-Service)',
    platform: 'windows',
    group: 'service',
  },
  {
    id: 'event_log',
    label: 'Журнал событий',
    description: 'Последние записи журнала Windows Events',
    platform: 'windows',
    group: 'logs',
    args: [
      { key: 'logName', label: 'Журнал', type: 'string', defaultValue: 'System' },
      { key: 'count', label: 'Записей', type: 'number', defaultValue: 20 },
    ],
  },
  {
    id: 'disk_info',
    label: 'Диски (WMI)',
    description: 'Информация о дисках через WMI/CIM',
    platform: 'windows',
    group: 'storage',
  },
  {
    id: 'cpu_usage',
    label: 'Загрузка CPU',
    description: 'Текущая загрузка процессора',
    platform: 'windows',
    group: 'system',
  },
  {
    id: 'network_config',
    label: 'Сетевые адаптеры',
    description: 'Конфигурация сетевых адаптеров (ipconfig /all)',
    platform: 'windows',
    group: 'network',
  },
  {
    id: 'os_version',
    label: 'Версия ОС',
    description: 'Версия и сборка Windows',
    platform: 'windows',
    group: 'system',
  },
  {
    id: 'mssql_query',
    label: 'MS SQL запрос',
    description: 'Выборка TOP 100 строк из указанной таблицы MS SQL',
    platform: 'windows',
    group: 'logs',
    args: [
      { key: 'table', label: 'Таблица', type: 'string', required: true },
    ],
  },
];

export const COMMAND_GROUPS: Record<string, string> = {
  system: 'Система',
  network: 'Сеть',
  storage: 'Диски',
  process: 'Процессы',
  service: 'Службы',
  logs: 'Журналы',
};

export function getCommandsForPlatform(platform: DevicePlatform): DiagnosticCommandDef[] {
  if (platform === 'any') {
    return DIAGNOSTIC_COMMANDS;
  }
  return DIAGNOSTIC_COMMANDS.filter(
    (cmd) => cmd.platform === platform || cmd.platform === 'any',
  );
}

export function getCommandById(id: DiagnosticsCommandId): DiagnosticCommandDef | undefined {
  return DIAGNOSTIC_COMMANDS.find((cmd) => cmd.id === id);
}

export function detectPlatformFromApp(app?: string | number | null): DevicePlatform {
  if (!app) return 'any';
  const appStr = String(app).toLowerCase();
  if (appStr.includes('esp32') || appStr.includes('esp')) return 'esp32';
  if (appStr.includes('linux') || appStr.includes('ubuntu') || appStr.includes('debian') || appStr.includes('rpi')) return 'linux';
  if (appStr.includes('win') || appStr.includes('windows')) return 'windows';
  return 'any';
}
