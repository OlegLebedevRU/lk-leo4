// src/features/tasks/domain/statusMapping.tsx
import { Tag, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import React from 'react';

// Функция для отображения статуса с иконкой и подсказкой
export const getStatusTag = (status: number): React.ReactNode => {
  switch (status) {
    case 0: // READY
      return (
        <Tooltip title="Готова к выполнению">
          <Tag icon={<SyncOutlined spin />} color="gold">
            В процессе
          </Tag>
        </Tooltip>
      );
    case 1: // PENDING
      return (
        <Tooltip title="Ожидает выполнения">
          <Tag icon={<ClockCircleOutlined spin />} color="gold">
            В процессе
          </Tag>
        </Tooltip>
      );
    case 2: // LOCK
      return (
        <Tooltip title="Выполняется">
          <Tag icon={<SyncOutlined spin />} color="gold">
            В процессе
          </Tag>
        </Tooltip>
      );
    case 3: // DONE
      return (
        <Tooltip title="Задача выполнена">
          <Tag icon={<CheckCircleOutlined />} color="green">
            Выполнено
          </Tag>
        </Tooltip>
      );
    case 4: // EXPIRED
      return (
        <Tooltip title="Время выполнения истекло">
          <Tag icon={<ClockCircleOutlined />} color="orange">
            Таймаут
          </Tag>
        </Tooltip>
      );
    case 5: // DELETED
      return (
        <Tooltip title="Задача удалена">
          <Tag icon={<DeleteOutlined />} color="default">
            Удалена
          </Tag>
        </Tooltip>
      );
    case 6: // FAILED
      return (
        <Tooltip title="Выполнение завершилось с ошибкой">
          <Tag icon={<CloseCircleOutlined />} color="red">
            Ошибка
          </Tag>
        </Tooltip>
      );
    case 7: // UNDEFINED
      return (
        <Tooltip title="Статус неизвестен">
          <Tag icon={<QuestionCircleOutlined />} color="default">
            Неизвестно
          </Tag>
        </Tooltip>
      );
    default:
      return (
        <Tooltip title="Неизвестный статус">
          <Tag color="default">—</Tag>
        </Tooltip>
      );
  }
};