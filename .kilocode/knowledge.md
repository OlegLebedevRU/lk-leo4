# LEO4 IoT Dashboard - Knowledge Base

## Проект

IoT Dashboard для мониторинга и управления устройствами LEO4.

## Технологии

- **Frontend**: React 19 + TypeScript
- **Routing**: TanStack Router
- **Build**: Vite
- **UI Library**: Ant Design 6.x
- **HTTP**: Axios с refresh token логикой
- **State**: React hooks

## Структура проекта

```
src/
├── features/          # Бизнес-логика по доменам
│   ├── devices/      # Устройства
│   ├── events/      # События
│   └── tasks/       # Задачи
├── pages/            # Страницы
├── common/           # Общие утилиты (HTTP)
└── routes/           # Маршрутизация
```

## API Endpoints

- `/api/devices` - управление устройствами
- `/api/tasks` - задачи (создание, выполнение, статус)
- `/api/events` - события

## Авторизация

- JWT токен хранится в localStorage
- Используется refresh token для продления сессии
- HTTP interceptor автоматически добавляет заголовки

## Документация UI

- [Ant Design Components](./ant-design-llms.md) - полная документация компонентов
- [Getting Started](https://ant.design/docs/react/getting-started) - быстрый старт
- [Customize Theme](https://ant.design/docs/react/customize-theme) - кастомизация темы
- [Table Component](https://ant.design/components/table) - таблицы
- [Form Component](https://ant.design/components/form) - формы
- [Modal Component](https://ant.design/components/modal) - модальные окна

## Backend API

- [Leo4 API Documentation](./backend-api.md) - полная документация бэкенда
  - Device Tasks - управление задачами
  - Device Events - события с пагинацией
  - Devices - управление устройствами
  - Postamats - работа с постаматами
  - Webhooks - настройка вебхуков
  - Gauges - показания датчиков

## Важные файлы

- [`src/features/tasks/domain/taskCreation.ts`](src/features/tasks/domain/taskCreation.ts) - создание задач
- [`src/features/tasks/domain/methodCodes.ts`](src/features/tasks/domain/methodCodes.ts) - коды методов
- [`src/common/httpPrivate.ts`](src/common/httpPrivate.ts) - HTTP клиент
- [`docs/notes.md`](docs/notes.md) - заметки разработчика
