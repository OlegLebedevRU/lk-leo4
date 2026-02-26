import type { BadgeProps } from 'antd';

export type StatusType = BadgeProps['status'];

export const STATUS_ENUM: StatusType[] = ['success', 'error', 'default'];

export type DeviceTag = {
  tag: string;
  value: string;
};

export type DeviceGaugesGauges = {
  [key: string]: {
    [subKey: string]: number[];
  }[];
};

export type DeviceGauges = {
  type?: string;
  updated_at: number | string;
  gauges?: DeviceGaugesGauges;
};

export type DeviceApiConnection = {
  last_checked_result: boolean;
};

export type DeviceApiResponse = {
  connection: DeviceApiConnection;
  device_id: number;
  sn: string;
  device_tags: DeviceTag[];
  device_gauges: DeviceGauges[];
};

export type DeviceId = string;

export type DeviceListItem = {
  device_id?: DeviceId;
  sn?: number | string;
  name?: number | string;
  status: StatusType;
  tags?: DeviceTag[];
  cmds?: string;
  active_ws?: StatusType;
  sip?: string;
  ipc?: string;
};

