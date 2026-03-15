// src/features/tasks/domain/methodCodes.ts

import methodCodesData from './methodCodes.json';

/**
 * Тип формата dt
 * - objectArray: список объектов [{key: value}, ...]
 * - stringArray: список строк ["value", ...]
 * - numberArray: список чисел [1, 2, ...]
 * - empty: пустой массив
 */
export type DtFormat = 'objectArray' | 'stringArray' | 'numberArray' | 'empty';

/**
 * Конфигурация полей dt для каждого method_code (из JSON)
 */
export interface MethodCodeFieldJson {
  /** Имя поля в форме */
  fieldName: string;
  /** Отображаемое имя поля */
  label: string;
  /** Тип поля */
  type: 'string' | 'number' | 'numberArray' | 'stringArray';
  /** Значение по умолчанию */
  defaultValue?: string | number | number[] | string[];
  /** Пример значения */
  example?: string | number;
  /** Описание поля */
  tooltip?: string;
  /** Группа полей (для размещения в одну строку) */
  group?: string;
}

/**
 * Конфигурация method_code (из JSON)
 */
export interface MethodCodeConfigJson {
  /** Код метода */
  code: number;
  /** Название метода */
  label: string;
  /** Описание метода */
  description?: string;
  /** Подсказка для выпадающего списка */
  dropdownTooltip?: string;
  /** Формат dt */
  dtFormat: DtFormat;
  /** Имя поля для objectArray (например, mt для {mt: value}) */
  objectField?: string;
  /** Поддержка множественных объектов (для method_code=16) */
  supportsMultiple?: boolean;
  /** Поля для ввода dt */
  dtFields: MethodCodeFieldJson[];
}

/**
 * Конфигурация полей dt для каждого method_code
 */
export interface MethodCodeField {
  /** Имя поля в форме */
  fieldName: string;
  /** Отображаемое имя поля */
  label: string;
  /** Тип поля */
  type: 'string' | 'number' | 'numberArray' | 'stringArray';
  /** Значение по умолчанию */
  defaultValue?: string | number | number[] | string[];
  /** Пример значения */
  example?: string | number;
  /** Описание поля */
  tooltip?: string;
  /** Группа полей (для размещения в одну строку) */
  group?: string;
}

/**
 * Конфигурация method_code
 */
export interface MethodCodeConfig {
  /** Код метода */
  code: number;
  /** Название метода */
  label: string;
  /** Описание метода */
  description?: string;
  /** Подсказка для выпадающего списка */
  dropdownTooltip?: string;
  /** Формат dt */
  dtFormat: DtFormat;
  /** Имя поля для objectArray (например, mt для {mt: value}) */
  objectField?: string;
  /** Поддержка множественных объектов (для method_code=16) */
  supportsMultiple?: boolean;
  /** Поля для ввода dt */
  dtFields: MethodCodeField[];
  /** Функция для формирования dt из значений полей */
  buildDt: (values: Record<string, unknown>) => unknown[];
  /** Функция для формирования dt из массива значений (для множественных объектов) */
  buildDtMultiple?: (items: Record<string, unknown>[]) => unknown[];
}

/**
 * Тип данных из JSON файла
 */
interface MethodCodesData {
  methodCodes: MethodCodeConfigJson[];
}

/**
 * Создать функцию buildDt на основе формата dt
 */
function createBuildDt(config: MethodCodeConfigJson): (values: Record<string, unknown>) => unknown[] {
  return (values: Record<string, unknown>): unknown[] => {
    switch (config.dtFormat) {
      case 'empty':
        return [];

      case 'stringArray': {
        // Для пинкода (35) - возвращает [pin]
        const field = config.dtFields[0];
        if (!field) return [];
        const value = values[field.fieldName];
        if (!value) return [];
        if (typeof value === 'string' && value.trim()) {
          return [value.trim()];
        }
        return [];
      }

      case 'numberArray': {
        // Для удаления привязок (47) - возвращает [1, 2, ...]
        const field = config.dtFields[0];
        if (!field) return [];
        const value = values[field.fieldName];
        if (Array.isArray(value)) {
          return value.filter((v): v is number => typeof v === 'number');
        }
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return parsed.filter((v): v is number => typeof v === 'number');
            }
          } catch {
            // Игнорируем ошибку парсинга
          }
        }
        return field.defaultValue as number[] ?? [];
      }

      case 'objectArray': {
        // Для команд (20) - возвращает [{mt: value}]
        // Или для привязки карты (16) - возвращает [{cd, cl}]
        if (config.objectField) {
          // Простой формат: {fieldName: value} -> {objectField: value}
          const field = config.dtFields[0];
          if (!field) return [];
          const value = values[field.fieldName];
          if (value === undefined || value === null || value === '') return [];
          return [{ [config.objectField]: value }];
        }
        // Сложный формат для method_code=16: {cd, cl}
        const cd = values.dt_cd as string | undefined;
        const cl = values.dt_cl as number | undefined;
        if (!cd || !String(cd).trim()) return [];
        return [{ cd: String(cd).trim(), cl: cl ?? 1 }];
      }

      default:
        return [];
    }
  };
}

/**
 * Создать функцию buildDtMultiple для множественных объектов
 */
function createBuildDtMultiple(config: MethodCodeConfigJson): ((items: Record<string, unknown>[]) => unknown[]) | undefined {
  // Только для method_code=16 (привязка карты)
  if (config.code !== 16 || !config.supportsMultiple) {
    return undefined;
  }

  return (items: Record<string, unknown>[]): unknown[] => {
    return items
      .filter(item => item.dt_cd && String(item.dt_cd).trim())
      .map(item => ({
        cd: String(item.dt_cd).trim(),
        cl: Number(item.dt_cl) || 1,
      }));
  };
}

/**
 * Преобразовать конфигурацию из JSON в полную конфигурацию с функциями
 */
function convertConfig(jsonConfig: MethodCodeConfigJson): MethodCodeConfig {
  return {
    code: jsonConfig.code,
    label: jsonConfig.label,
    description: jsonConfig.description,
    dropdownTooltip: jsonConfig.dropdownTooltip,
    dtFormat: jsonConfig.dtFormat,
    objectField: jsonConfig.objectField,
    supportsMultiple: jsonConfig.supportsMultiple,
    dtFields: jsonConfig.dtFields,
    buildDt: createBuildDt(jsonConfig),
    buildDtMultiple: createBuildDtMultiple(jsonConfig),
  };
}

/**
 * Список всех поддерживаемых method_code и их конфигураций
 * Загружается из JSON файла
 */
export const METHOD_CODES: MethodCodeConfig[] = (methodCodesData as MethodCodesData).methodCodes.map(convertConfig);

/**
 * Получить конфигурацию method_code по коду
 */
export function getMethodCodeConfig(code: number): MethodCodeConfig | undefined {
  return METHOD_CODES.find((config) => config.code === code);
}

/**
 * Получить список опций для выпадающего списка
 */
export function getMethodCodeOptions(): Array<{ value: number; label: string }> {
  return METHOD_CODES.map((config) => ({
    value: config.code,
    label: config.label,
  }));
}
