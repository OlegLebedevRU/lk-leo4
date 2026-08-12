export type DiagnosticsLogLevel = 'debug' | 'info' | 'warning' | 'error';

export type DevicePlatform = 'esp32' | 'linux' | 'windows' | 'any';

export type DiagnosticsCommandId =
  // Universal
  | 'system_info'
  | 'network_info'
  | 'disk_usage'
  | 'service_status'
  // Linux
  | 'uptime'
  | 'memory_usage'
  | 'process_list'
  | 'journal_logs'
  | 'top_processes'
  | 'iptables_rules'
  | 'systemctl_status'
  // Windows
  | 'get_processes'
  | 'get_services'
  | 'event_log'
  | 'disk_info'
  | 'cpu_usage'
  | 'network_config'
  | 'os_version'
  | 'mssql_query';

export type BrowserDiagnosticsMessage =
  | {
      type: 'start_log';
      level?: DiagnosticsLogLevel;
      stream?: string;
      ttl_sec?: number;
      max_rate_bps?: number;
    }
  | {
      type: 'stop_log';
      session_id: string;
      stream?: string;
    }
  | {
      type: 'exec';
      command_id: DiagnosticsCommandId;
      args?: Record<string, unknown>;
      ttl_sec?: number;
      max_output_bytes?: number;
    }
  | {
      type: 'cancel';
      session_id: string;
      reason?: string;
    };

export type BackendDiagnosticsMessage =
  | {
      type: 'output';
      sn: string;
      session_id: string;
      seq: number;
      ts?: string | null;
      kind: 'log' | 'stdout' | 'stderr' | 'status' | 'result' | 'error';
      stream: string;
      encoding: 'utf-8' | 'base64';
      data: string;
      eof?: boolean;
      exit_code?: number | null;
      truncated?: boolean;
    }
  | {
      type: 'status';
      session_id: string;
      status: string;
    }
  | {
      type: 'error';
      session_id?: string | null;
      error: string;
    };
