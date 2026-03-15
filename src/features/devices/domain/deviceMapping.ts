import {
  STATUS_ENUM,
  type DeviceApiResponse,
  type DeviceGauges,
  type DeviceListItem,
  type DeviceTag,
  type StatusType,
} from '../types';
import {
  GAUGE_CODE_WS,
  GAUGE_GROUP,
  GAUGE_TYPE_WS,
  MAX_WS_STALE_SECONDS,
} from './constants';

type DescriptionAndCmds = {
  description: string;
  cmds: string;
};

function buildDescriptionAndCmds(tags: DeviceTag[]): DescriptionAndCmds {
  let description = '';
  let cmds = '';

  tags.forEach((val) => {
    if (!val) {
      return;
    }

    if (val.tag === 'name' || val.tag === 'description') {
      description = description.concat(' ', val.value);
    } else if (val.tag === 'cmd') {
      cmds = cmds.concat(' ', val.value);
    }
  });

  return { description, cmds };
}

function getDeviceStatus(connection: DeviceApiResponse['connection']): StatusType {
  return connection.last_checked_result ? STATUS_ENUM[0] : STATUS_ENUM[1];
}

function getGaugeWsValue(gauge: DeviceGauges): number | undefined {
  const group = gauge.gauges?.[GAUGE_GROUP]?.[0];
  const value = group?.[GAUGE_CODE_WS]?.[0];
  return value;
}

function getGaugeAgeSeconds(updatedAt: DeviceGauges['updated_at']): number {
  const updatedTime = new Date(updatedAt).getTime();
  return Math.floor((Date.now() - updatedTime) / 1000);
}

function getWsStatus(
  connection: DeviceApiResponse['connection'],
  deviceGauges: DeviceGauges[],
): StatusType {
  let wsStatus: StatusType = STATUS_ENUM[1];

  deviceGauges.forEach((gauge) => {
    if (!gauge || gauge.type !== GAUGE_TYPE_WS) {
      return;
    }

    const value = getGaugeWsValue(gauge);
    const ageSeconds = getGaugeAgeSeconds(gauge.updated_at);

    if (
      !connection.last_checked_result ||
      value === undefined ||
      value === 0 ||
      ageSeconds > MAX_WS_STALE_SECONDS
    ) {
      wsStatus = STATUS_ENUM[1];
    } else {
      wsStatus = STATUS_ENUM[0];
    }
  });

  return wsStatus;
}

function getMinWsAgeSeconds(deviceGauges: DeviceGauges[]): number | undefined {
  let minAge: number | undefined;
  deviceGauges.forEach((gauge) => {
    if (gauge.type === GAUGE_TYPE_WS) {
      const age = getGaugeAgeSeconds(gauge.updated_at);
      if (minAge === undefined || age < minAge) minAge = age;
    }
  });
  return minAge;
}

export function mapDevicesToListItems(devices: DeviceApiResponse[]): DeviceListItem[] {
  return devices.map((device) => {
    const { description, cmds } = buildDescriptionAndCmds(device.device_tags);
    const status = getDeviceStatus(device.connection);
    const active_ws = getWsStatus(device.connection, device.device_gauges);
    const ageSeconds = getMinWsAgeSeconds(device.device_gauges);  // Новое поле

    return {
      device_id: String(device.device_id),
      sn: device.sn,
      name: description,
      status,
      cmds,
      tags: device.device_tags,
      active_ws,
      ageSeconds,  // Добавлено
    };
  });
}

