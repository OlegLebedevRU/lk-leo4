// src/features/tasks/domain/methodCodes.ts

import methodCodesData from './methodCodes.json';

/**
 * Тип формата dt
 * - objectArray: список объектов [{key: value}, ...]
 * - stringArray: список строк ["value", ...]
 * - numberArray: список чисел [1, 2, ...]
 * - empty: пустой массив
 * - dbWrite: запись данных в БД [{ns, k, t, v}, ...]
 */
export type DtFormat = 'objectArray' | 'stringArray' | 'numberArray' | 'empty' | 'dbWrite';

/**
 * Поддерживаемые типы данных для записи в БД
 */
export type DbWriteDataType = 'i8' | 'u8' | 'i16' | 'u16' | 'i32' | 'u32' | 'str';

/**
 * Элемент данных для записи в БД
 */
export interface DbWriteDtItem {
  ns: string;
  k: string;
  t: DbWriteDataType;
  v: number | string;
}

/**
 * Валидация типа данных
 */
/**
 * Валидация типа данных
 */
export function isValidDbWriteType(type: string): type is DbWriteDataType {
  return ['i8', 'u8', 'i16', 'u16', 'i32', 'u32', 'str'].includes(type);
}

/**
 * Парсинг значения в соответствии с типом данных
 * @param value Строковое значение
 * @param type Тип данных
 * @returns Числовое или строковое значение
 * @throws Error при некорректном значении
 */
export function parseDbWriteValue(value: string, type: DbWriteDataType): number | string {
  if (type === 'str') {
    return value;
  }

  // Проверка на пустое значение для числовых типов
  if (value === '' || value === undefined || value === null) {
    throw new Error('Значение не может быть пустым для числового типа');
  }

  // Проверяем, что значение является числом
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`Значение должно быть целым числом для типа ${type}`);
  }

  const num = parseInt(value, 10);

  // Проверка границ для знаковых типов
  switch (type) {
    case 'i8':
      if (num < -128 || num > 127) {
        throw new Error('Значение должно быть в диапазоне -128...127 для i8');
      }
      return num;
    case 'u8':
      if (num < 0 || num > 255) {
        throw new Error('Значение должно быть в диапазоне 0...255 для u8');
      }
      return num;
    case 'i16':
      if (num < -32768 || num > 32767) {
        throw new Error('Значение должно быть в диапазоне -32768...32767 для i16');
      }
      return num;
    case 'u16':
      if (num < 0 || num > 65535) {
        throw new Error('Значение должно быть в диапазоне 0...65535 для u16');
      }
      return num;
    case 'i32':
      if (num < -2147483648 || num > 2147483647) {
        throw new Error('Значение должно быть в диапазоне -2147483648...2147483647 для i32');
      }
      return num;
    case 'u32':
      if (num < 0 || num > 4294967295) {
        throw new Error('Значение должно быть в диапазоне 0...4294967295 для u32');
      }
      return num;
    default:
      throw new Error(`Неизвестный тип данных: ${type}`);
  }
}

/**
 * Формирование объекта dt для записи в БД
 */
function buildDbWriteItem(values: Record<string, unknown>): DbWriteDtItem | null {
  const ns = String(values.dt_ns || '').trim();
  const k = String(values.dt_k || '').trim();
  const t = String(values.dt_t || 'i32').trim();
  const v = String(values.dt_v || '');

  if (!ns) {
    throw new Error('Раздел БД (ns) не может быть пустым');
  }
  if (!k) {
    throw new Error('Ключ параметра (k) не может быть пустым');
  }
  if (!isValidDbWriteType(t)) {
    throw new Error(`Недопустимый тип данных: ${t}. Допустимы: i8, u8, i16, u16, i32, u32, str`);
  }

  const parsedValue = parseDbWriteValue(v, t);

  return {
    ns,
    k,
    t,
    v: parsedValue,
  };
}

/**
 * Конфигурация полей dt для каждого method_code (из JSON)
 */
export interface MethodCodeFieldJson {
  /** Имя поля в форме */
  fieldName: string;
  /** Отображаемое имя поля */
  label: string;
  /** Тип поля */
  type: 'string' | 'number' | 'numberArray' | 'stringArray' | 'select';
  /** Значение по умолчанию */
  defaultValue?: string | number | number[] | string[];
  /** Пример значения */
  example?: string | number;
  /** Описание поля */
  tooltip?: string;
  /** Группа полей (для размещения в одну строку) */
  group?: string;
  /** Опции для типа select */
  options?: Array<{ value: string; label: string }>;
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
  type: 'string' | 'number' | 'numberArray' | 'stringArray' | 'select';
  /** Значение по умолчанию */
  defaultValue?: string | number | number[] | string[];
  /** Пример значения */
  example?: string | number;
  /** Описание поля */
  tooltip?: string;
  /** Группа полей (для размещения в одну строку) */
  group?: string;
  /** Опции для типа select */
  options?: Array<{ value: string; label: string }>;
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

      case 'dbWrite': {
        // Для записи данных в БД (49) - возвращает [{ns, k, t, v}, ...]
        // Поддержка множественных записей
        if (config.supportsMultiple && values.dt_items && Array.isArray(values.dt_items)) {
          return (values.dt_items as Record<string, unknown>[])
            .map(item => buildDbWriteItem(item))
            .filter((item): item is DbWriteItem => item !== null);
        }
        // Одиночная запись
        const item = buildDbWriteItem(values);
        return item ? [item] : [];
      }

      default:
        return [];
    }
  };
}

/**
 * Тип для элемента БД (используется внутри createBuildDt)
 */
interface DbWriteItem {
  ns: string;
  k: string;
  t: DbWriteDataType;
  v: number | string;
}

/**
 * Создать функцию buildDtMultiple для множественных объектов
 */
function createBuildDtMultiple(config: MethodCodeConfigJson): ((items: Record<string, unknown>[]) => unknown[]) | undefined {
  // Только для method_code=16 (привязка карты) и method_code=49 (запись в БД)
  if (config.code === 16 && config.supportsMultiple) {
    return (items: Record<string, unknown>[]): unknown[] => {
      return items
        .filter(item => item.dt_cd && String(item.dt_cd).trim())
        .map(item => ({
          cd: String(item.dt_cd).trim(),
          cl: Number(item.dt_cl) || 1,
        }));
    };
  }

  // Для method_code=49 (запись в БД) - используется buildDbWriteItem
  if (config.code === 49 && config.dtFormat === 'dbWrite' && config.supportsMultiple) {
    return (items: Record<string, unknown>[]): unknown[] => {
      return items
        .map(item => buildDbWriteItem(item))
        .filter((item): item is DbWriteItem => item !== null);
    };
  }

  return undefined;
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
