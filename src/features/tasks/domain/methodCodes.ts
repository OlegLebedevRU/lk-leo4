// src/features/tasks/domain/methodCodes.ts

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
  /** Поля для ввода dt */
  dtFields: MethodCodeField[];
  /** Поддержка множественных объектов (для method_code=16) */
  supportsMultiple?: boolean;
  /** Функция для формирования dt из значений полей */
  buildDt: (values: Record<string, unknown>) => unknown[];
  /** Функция для формирования dt из массива значений (для множественных объектов) */
  buildDtMultiple?: (items: Record<string, unknown>[]) => unknown[];
}

/**
 * Список всех поддерживаемых method_code и их конфигураций
 */
export const METHOD_CODES: MethodCodeConfig[] = [
  {
    code: 16,
    label: '16 - Привязка карты/пинкода к слоту',
    description: 'Привязка ID карты/пинкода к слоту/ячейке',
    dropdownTooltip: 'Привязка ID карты/пинкода к слоту/ячейке',
    supportsMultiple: true,
    dtFields: [
      {
        fieldName: 'dt_cd',
        label: 'ID карты/пинкод',
        type: 'string',
        defaultValue: '',
        example: '111111',
        tooltip: 'ID карты или пинкод (до 6 цифр)',
        group: 'bind',
      },
      {
        fieldName: 'dt_cl',
        label: 'Слот/ячейка',
        type: 'number',
        defaultValue: 1,
        example: 1,
        tooltip: 'Номер слота/ячейки (1-255)',
        group: 'bind',
      },
    ],
    buildDt: (values) => {
      const cd = values.dt_cd as string || '';
      const cl = values.dt_cl as number ?? 1;
      if (!cd) return [];
      return [{ cd, cl }];
    },
    buildDtMultiple: (items) => {
      return items
        .filter(item => item.dt_cd && String(item.dt_cd).trim())
        .map(item => ({
          cd: String(item.dt_cd).trim(),
          cl: Number(item.dt_cl) || 1,
        }));
    },
  },
  {
    code: 20,
    label: '20 - Короткие команды',
    description: 'Отправка коротких команд на устройство',
    dropdownTooltip: 'Короткие команды',
    dtFields: [
      {
        fieldName: 'dt_mt',
        label: 'Команда',
        type: 'number',
        defaultValue: 4,
        example: 4,
        tooltip: 'Номер команды',
      },
    ],
    buildDt: (values) => {
      return [{ mt: values.dt_mt ?? 4 }];
    },
  },
  {
    code: 21,
    label: '21 - Перезагрузка',
    description: 'Перезагрузка устройства',
    dropdownTooltip: 'Перезагрузка устройства',
    dtFields: [],
    buildDt: () => {
      return [];
    },
  },
  {
    code: 35,
    label: '35 - Ввод пинкода',
    description: 'Ввести пинкод удаленно',
    dropdownTooltip: 'Ввести пинкод удаленно',
    dtFields: [
      {
        fieldName: 'dt_pin',
        label: 'Пинкод',
        type: 'string',
        defaultValue: '',
        example: '123456',
        tooltip: 'Пинкод (до 6 цифр)',
      },
    ],
    buildDt: (values) => {
      const pin = values.dt_pin as string || '';
      if (!pin) return [];
      return [pin];
    },
  },
  {
    code: 47,
    label: '47 - Удаление привязок',
    description: 'Удаление всех привязок к слоту/списку слотов',
    dropdownTooltip: 'Удаление всех привязок к слоту',
    dtFields: [
      {
        fieldName: 'dt_values',
        label: 'Слоты',
        type: 'numberArray',
        defaultValue: [1],
        example: '[1, 2]',
        tooltip: 'Номера слотов для удаления привязок',
      },
    ],
    buildDt: (values) => {
      const valuesStr = values.dt_values;
      if (Array.isArray(valuesStr)) {
        return valuesStr;
      }
      // Попытка распарсить строку вида "[1,2]"
      if (typeof valuesStr === 'string') {
        try {
          const parsed = JSON.parse(valuesStr);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // Игнорируем ошибку парсинга
        }
      }
      return [1];
    },
  },
];

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
