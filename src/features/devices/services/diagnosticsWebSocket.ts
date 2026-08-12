import type { BrowserDiagnosticsMessage } from '../types/diagnostics';

const DIAGNOSTICS_WS_PATH = '/api/jwt/v1/diagnostics/ws/devices';

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

function getCurrentWsOrigin(): string {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}`;
}

export function buildDiagnosticsWsUrl(sn: string): string {
  const configuredOrigin = import.meta.env.VITE_DIAGNOSTICS_WS_ORIGIN as string | undefined;
  const origin = configuredOrigin ? normalizeOrigin(configuredOrigin) : getCurrentWsOrigin();

  return `${origin}${DIAGNOSTICS_WS_PATH}/${encodeURIComponent(sn)}`;
}

export function createDiagnosticsWebSocket(sn: string): WebSocket {
  return new WebSocket(buildDiagnosticsWsUrl(sn));
}

export function sendDiagnosticsMessage(
  ws: WebSocket,
  message: BrowserDiagnosticsMessage,
): void {
  ws.send(JSON.stringify(message));
}
