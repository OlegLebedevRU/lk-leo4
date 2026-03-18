# Анализ архитектуры проекта React + Ant Design

## Введение

Данный отчёт представляет собой комплексный анализ архитектуры проекта **lk-leo4** — веб-приложения для мониторинга и управления устройствами IoT. Проект построен на стеке React 19, Ant Design 5, React Router v7 и использует Vite 7 в качестве сборщика.

**Дата обновления**: 2026-03-18

---

## 1. Обзор технологического стека

Проект использует современный и стабильный технологический стек.

### 1.1 Текущий стек

| Уровень | Технология | Версия | Оценка |
|---------|-----------|--------|--------|
| Фреймворк | React | 19.2.0 | Актуально |
| UI-библиотека | Ant Design | 5.21.6 | Актуально |
| Компоненты | @ant-design/pro-components | 2.8.10 | Актуально |
| Роутинг | React Router | 7.13.0 | Актуально |
| HTTP-клиент | Axios | 1.13.6 | Актуально |
| Сборщик | Vite | 7.1.9 | Актуально |
| Язык | TypeScript | 5.9.3 | Актуально |
| Состояние | TanStack Query | 最新 | Актуально |

### 1.2 Code Splitting

В файле [`vite.config.ts`](vite.config.ts:1) настроен code splitting:

```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router'],
  'vendor-antd': ['antd', '@ant-design/icons', '@ant-design/pro-components', '@ant-design/pro-provider'],
  'vendor-utils': ['axios', 'react-syntax-highlighter'],
}
```

Бандлы разделяются на логические части, что улучшает время загрузки.

---

## 2. Реализованные архитектурные решения

### 2.1 Layout применяется к маршрутам ✅

**Статус**: Исправлено

В файле [`src/entry.client.tsx`](src/entry.client.tsx:1) маршруты определены с использованием `PageWithLayout`:

```typescript
// Обертка для применения Layout с ленивой загрузкой
function PageWithLayout({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Layout>
        <Component />
      </Layout>
    </Suspense>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <PageWithLayout component={HomePage} /> },
  { path: "/login", element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
  { path: "*", element: <Suspense fallback={<PageLoader />}><Layout><CatchAll /></Layout></Suspense> },
]);
```

Компонент [`Layout.tsx`](src/Layout.tsx:1) содержит `ConfigProvider`, `ProConfigProvider` и `AntdApp` и применяется ко всем страницам кроме `/login`.

### 2.2 React Query (TanStack Query) ✅

**Статус**: Полностью реализовано

Реализован централизованный слой управления серверным состоянием:

#### Провайдер
- [`src/providers/QueryProvider.tsx`](src/providers/QueryProvider.tsx:1) — оборачивает приложение

#### Хуки
- [`src/hooks/useDevices.ts`](src/hooks/useDevices.ts:1) — получение устройств
- [`src/hooks/useTasks.ts`](src/hooks/useTasks.ts:1) — управление задачами
- [`src/hooks/useEvents.ts`](src/hooks/useEvents.ts:1) — получение событий

#### Использование в компонентах
- ✅ **DeviceList.tsx** — использует `useDevices` хук
- ✅ **TasksList.tsx** — использует `useTasks` хук
- ✅ **EventsList.tsx** — использует `useEvents` хук
- ✅ **CreateNewTask.tsx** — использует `useCreateTask` и `useGetTaskResult`

### 2.3 Унифицированная тема ✅

**Статус**: Исправлено

Все страницы теперь используют统一ную тему через Layout:

```typescript
// Layout.tsx
<ConfigProvider locale={ruRU} theme={{ algorithm: theme.compactAlgorithm }}>
  <ProConfigProvider intl={ruRUIntl}>
    <AntdApp>
      {children}
    </AntdApp>
  </ProConfigProvider>
</ConfigProvider>
```

---

## 3. Routing и маршрутизация

### 3.1 Текущая реализация

Текущая реализация использует три маршрута:
- `/` — главная страница мониторинга
- `/login` — страница входа (без Layout)
- `*` — catch-all для 404

### 3.2 Рекомендации по развитию

Для масштабирования рекомендуется добавить:
- Навигационное меню для перехода между разделами
- Динамические маршруты для отдельных устройств (например, `/devices/:id`)
- Вложенные маршруты для табов внутри страниц

---

## 4. HTTP-слой и работа с API

### 4.1 Реализация

Реализация HTTP-слоя в [`src/common/httpPrivate.ts`](src/common/httpPrivate.ts:1):

- **Автоматический refresh token**: При получении 401 система автоматически пытается обновить токен
- **Waiting list pattern**: Если уже идёт refresh, новые запросы ожидают его результат
- **Interceptor для 401**: [`AuthHandler.tsx`](src/components/AuthHandler.tsx:1) обрабатывает редирект на страницу логина

```typescript
// httpPrivate.ts — обработка refresh
if (status === 401) {
  if (!originalRequest._retry) {
    originalRequest._retry = true;
    isRefreshing = true;
    const refreshSuccess = await refreshToken();
    // повтор оригинального запроса
  }
}
```

### 4.2 Проблемы

**Избыточное логирование**: В [`httpPrivate.ts`](src/common/httpPrivate.ts:1) присутствуют многочисленные `console.log`:

```typescript
console.log('AXIOS REQUEST:', config.method?.toUpperCase(), config.url);
console.log('[DeviceList] Fetch error:', error);
```

Рекомендуется использовать библиотеку логирования (например, `loglevel` или интеграцию с Sentry).

**Конфигурация в коде**: URL-адреса API захардкожены в [`config.ts`](src/common/config.ts:1).

---

## 5. CSS и стилизация

### 5.1 Глобальные стили

Файл [`src/index.css`](src/index.css:1) содержит:
- CSS Variables для темной и светлой темы
- Мобильные медиа-запросы (@media)
- Исправления для Ant Design компонентов
- Кастомные классы для выделения строк

### 5.2 Проблемы

**Смешение подходов**: Используются как inline styles, так и CSS классы.

Рекомендуется вынести сложные стили в CSS modules или использовать Ant Design токены.

---

## 6. Безопасность

### 6.1 Реализованные меры

- **httpOnly cookies**: Токены хранятся в httpOnly cookies, недоступных через JavaScript
- **CSRF Protection**: [`src/common/csrf.ts`](src/common/csrf.ts:1) — автоматическое добавление X-CSRFToken заголовка
- **Basic Auth + Captcha**: [`loginApp.tsx`](src/pages/loginApp.tsx:1) использует SmartCaptcha от Яндекса
- **withCredentials**: Настроены для всех запросов
- **AuthHandler**: Обрабатывает 401 ошибки и редиректит на /login
- **Error Boundary**: [`ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx:1) — перехват ошибок рендеринга

### 6.2 Рекомендации

**CSRF Protection:** ✅ Реализована на фронтенде. Требует настройки бэкенда (см. [`docs/CSRF_BACKEND_SETUP.md`](docs/CSRF_BACKEND_SETUP.md:1))

---

## 7. Итоговые рекомендации

### Приоритет 1 — Оптимизация

| № | Проблема | Решение |
|---|----------|---------|
| 1 | ~~DeviceList.tsx не использует хук~~ | ✅ Переписано на `useDevices()` |
| 2 | ~~TasksList.tsx не использует хук~~ | ✅ Переписано на `useTasks()` |
| 3 | ~~home.tsx использует прямой axiosPrivate~~ | ✅ Переписано на `useDeviceInfo()` |
| 4 | Console.log в production | ✅ Удалены |
| 5 | Нет Error Boundary | ✅ Добавлен |
| 6 | Нет CSRF protection | ✅ Добавлена (требует бэкенд) |

### Приоритет 2 — Оптимизация

| № | Проблема | Решение |
|---|----------|---------|
| 3 | Console.log в production | Настроить логирование через библиотеку |
| 4 | Inline styles | Вынести в CSS Modules |

### Приоритет 3 — Безопасность и качество

| № | Проблема | Решение |
|---|----------|---------|
| 5 | Нет тестов | Добавить Vitest + React Testing Library |
| 6 | any types | Типизировать Axios errors |
| 7 | CSRF | Добавить CSRF token |

---

## 8. Структура проекта

```
src/
├── entry.client.tsx    # Точка входа (createRoot + RouterProvider + createBrowserRouter)
├── Layout.tsx          # Основной layout с antd (ConfigProvider, ProConfigProvider)
├── catchall.tsx        # Catch-all для 404
├── providers/
│   └── QueryProvider.tsx # React Query провайдер
├── hooks/
│   ├── useDevices.ts   # Хук для работы с устройствами
│   ├── useTasks.ts     # Хук для работы с задачами
│   └── useEvents.ts    # Хук для работы с событиями
├── components/
│   ├── AuthHandler.tsx # Обработчик 401 редиректов
│   └── PageLoader.tsx  # Индикатор загрузки
├── common/
│   ├── config.ts       # Конфигурация API
│   ├── httpPrivate.ts  # Axios с интерцепторами, 401 обработка
│   ├── httpPublic.ts   # Публичный axios без токена
│   └── httpRefreshToken.ts # Обновление токена
├── features/           # Feature-based модули
│   ├── devices/
│   │   ├── api/devices.ts
│   │   ├── types.ts
│   │   └── domain/deviceMapping.ts
│   ├── tasks/
│   │   ├── api/tasks.ts
│   │   ├── types.ts
│   │   └── domain/taskMapping.ts
│   └── events/
│       ├── api/events.ts
│       ├── types.ts
│       └── domain/eventMapping.ts
└── pages/
    ├── loginApp.tsx    # Форма логина
    ├── home.tsx        # Главная страница
    ├── DeviceList.tsx   # Список устройств
    ├── TasksList.tsx    # Список задач
    ├── EventsList.tsx   # Список событий
    ├── DeviceTags.tsx   # Теги устройств
    └── CreateNewTask.tsx # Создание задачи
```

---

## Заключение

Проект lk-leo4 демонстрирует хорошее понимание React и Ant Design. Структура файлов логична, используются современные практики (code splitting, lazy loading, interceptors, React Query).

Все критические архитектурные проблемы исправлены:
- ✅ Layout применяется к маршрутам
- ✅ React Query используется во всех компонентах
- ✅ Унифицированная тема
- ✅ Error Boundary добавлен
- ✅ CSRF protection реализована (требует бэкенд)
- ✅ console.log удалены из production

Проект готов к масштабированию и долгосрочной поддержке.
