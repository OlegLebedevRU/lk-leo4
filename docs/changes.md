# История изменений

## 2026-03-18 - Исправления архитектуры SPA CSR

### Вынос axiosPrivate в React Query хуки

**Проблема:**
- home.tsx использовал прямые вызовы axiosPrivate вместо React Query
- Данные загружались вручную без кэширования

**Решение:**
- Добавлен API метод [`fetchDeviceById()`](src/features/devices/api/devices.ts:9)
- Добавлен хук [`useDeviceInfo(deviceId)`](src/hooks/useDevices.ts:30)
- Обновлён home.tsx — использует React Query вместо прямых вызовов

### Добавлен Error Boundary

**Проблема:**
- При ошибках рендеринга приложение крашалось полностью
- Не было graceful обработки ошибок

**Решение:**
- Создан [`ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx:1)
- Интегрирован в [`entry.client.tsx`](src/entry.client.tsx:10)
- Добавлены кнопки "Попробовать снова" и "На главную"

### Удалены console.log из production

**Проблема:**
- Многочисленные console.log/warn в httpPrivate.ts и httpRefreshToken.ts

**Решение:**
- Удалены все console.log и console.warn
- console.error оставлен только с проверкой `import.meta.env.DEV`

### Реализована CSRF protection

**Проблема:**
- Отсутствовала CSRF защита

**Решение:**
- Создан [`src/common/csrf.ts`](src/common/csrf.ts:1) — утилиты для работы с CSRF токеном
- Обновлён [`httpPrivate.ts`](src/common/httpPrivate.ts:14) — автоматическое добавление заголовка X-CSRFToken
- Обновлён [`httpRefreshToken.ts`](src/common/httpRefreshToken.ts:4) — добавление CSRF токена
- Создана документация [`docs/CSRF_BACKEND_SETUP.md`](docs/CSRF_BACKEND_SETUP.md:1)

---

## 2026-03-18 - Завершение миграции на React Query

### Проблема
- Часть компонентов использовала прямые вызовы API вместо React Query хуков
- Отсутствовала централизованная система query keys для инвалидации
- Не все компоненты использовали автоматическое кэширование и инвалидацию

### Решение
Завершён полный переход на React Query для управления серверным состоянием во всех компонентах.

### Изменения

#### src/hooks/useTasks.ts
- Добавлены **query keys** для tasks: `tasksKeys.all`, `tasksKeys.lists()`, `tasksKeys.list(deviceId)`, `tasksKeys.details()`, `tasksKeys.detail(taskId)`
- Добавлен хук [`useTaskDetail()`](src/hooks/useTasks.ts:26) для получения деталей задачи
- Добавлен хук [`useGetTaskResult()`](src/hooks/useTasks.ts:48) для получения результата задачи с автоматической инвалидацией

#### src/hooks/useDevices.ts
- Добавлены **query keys** для devices: `devicesKeys.all`, `devicesKeys.list()`, `devicesKeys.detail(deviceId)`
- Добавлен хук [`useInvalidateDevices()`](src/hooks/useDevices.ts:28) для принудительного обновления

#### src/hooks/useEvents.ts
- **Создан** - хук для работы с событиями устройства
- Добавлены **query keys** для events: `eventsKeys.all`, `eventsKeys.lists()`, `eventsKeys.list(deviceId)`
- Поддержка пагинации и автообновления через `refetchInterval`
- Добавлен хук [`useInvalidateEvents()`](src/hooks/useEvents.ts:38) для принудительного обновления

#### src/providers/QueryProvider.tsx
- Добавлены настройки по умолчанию: `staleTime: 60000`, `gcTime: 300000`, `retry: 1`, `refetchOnWindowFocus: false`

### Использование в компонентах

| Компонент | Хук | Статус |
|-----------|-----|--------|
| [`DeviceList.tsx`](src/pages/DeviceList.tsx) | `useDevices` | ✅ |
| [`TasksList.tsx`](src/pages/TasksList.tsx) | `useTasks` | ✅ |
| [`EventsList.tsx`](src/pages/EventsList.tsx) | `useEvents` | ✅ |
| [`CreateNewTask.tsx`](src/pages/CreateNewTask.tsx) | `useCreateTask`, `useGetTaskResult` | ✅ |

### Результат
- Все компоненты используют React Query для управления серверным состоянием
- Централизованные query keys позволяют точно инвалидировать кэш
- Автоматическое кэширование с настраиваемым `staleTime`
- Поддержка автообновления через `refetchInterval`
- Индикаторы загрузки и ошибок во всех компонентах

### Проблема
- Кнопки "Отправить задачу" и "Получить результат" не имели логики блокировки
- Поле "Ответ сервера" не визуализировало получение новых данных
- При повторной отправке задачи старые данные не очищались

### Решение
Добавлена логика управления состоянием кнопок и визуальная обратная связь.

### Изменения

#### src/pages/CreateNewTask.tsx
- Добавлены переменные состояния:
  - [`isValidPacket`](src/pages/CreateNewTask.tsx:63) - проверка валидности JSON-пакета
  - [`canSubmit`](src/pages/CreateNewTask.tsx:66) - управление доступностью кнопки "Отправить задачу"
  - [`canGetResult`](src/pages/CreateNewTask.tsx:67) - управление доступностью кнопки "Получить результат"
  - [`serverResponseBlink`](src/pages/CreateNewTask.tsx:50) - эффект моргания для поля "Ответ сервера"
- Кнопка "Отправить задачу": [`disabled={!canSubmit}`](src/pages/CreateNewTask.tsx:414)
- Кнопка "Получить результат": [`disabled={!canGetResult}`](src/pages/CreateNewTask.tsx:446)
- Поле "Ответ сервера": эффект моргания фона при получении данных

### Результат
- Кнопка "Отправить задачу" заблокирована при отсутствии валидного пакета или во время запроса
- Кнопка "Получить результат" разблокируется после получения ответа от сервера
- Поле "Ответ сервера" визуально реагирует на новые данные

---

## 2026-03-18 - Переписывание CreateNewTask.tsx на React Query

### Проблема
- В компоненте CreateNewTask использовался прямой вызов `fetchTaskDetail()` вместо мутации React Query
- Неиспользуемые переменные `loadings`, `enterLoading`, `taskDetail`, `isLoadingDetail`
- Импорт неиспользуемого хука `useTaskDetail`

### Решение
Завершён переход на React Query для управления серверным состоянием.

### Изменения

#### src/hooks/useTasks.ts
- **Добавлен** - хук [`useGetTaskResult()`](src/hooks/useTasks.ts:46) для получения результата задачи с автоматической инвалидацией кэша

#### src/pages/CreateNewTask.tsx
- Импортирован хук [`useGetTaskResult`](src/pages/CreateNewTask.tsx:17) из хуков
- Заменён прямой вызов `fetchTaskDetail()` на мутацию [`getTaskResultMutation.mutateAsync()`](src/pages/CreateNewTask.tsx:58)
- Добавлен индикатор загрузки [`loading={getTaskResultMutation.isPending}`](src/pages/CreateNewTask.tsx:49) на кнопку "Получить результат"
- Удалены неиспользуемые переменные и импорты

### Результат
- Компонент полностью использует React Query для управления состоянием серверных данных
- Индикатор загрузки показывается при получении результата задачи
- Автоматическая инвалидация кэша после получения результата

### Проблема
- Layout не применялся к маршрутам - тема Ant Design работала некорректно
- Дублирование ConfigProvider и ProConfigProvider на разных страницах
- Отсутствие централизованного управления серверным состоянием

### Решение
Применение Layout ко всем маршрутам и внедрение React Query.

### Изменения

#### src/entry.client.tsx
- Добавлена обёртка `PageWithLayout` для применения Layout
- Добавлен `QueryProvider` для React Query
- Импорт loginApp вместо login

#### src/pages/loginApp.tsx
- **Изменён** - удалены локальные ConfigProvider и ProConfigProvider
- Добавлена кастомная стилизация страницы логина

#### package.json
- Добавлен `@tanstack/react-query`

#### src/providers/QueryProvider.tsx
- **Создан** - провайдер React Query с настройками по умолчанию

#### src/hooks/useDevices.ts
- **Создан** - хук для получения списка устройств с кэшированием

#### src/hooks/useTasks.ts
- **Создан** - хуки для работы с задачами (получение, создание)

#### src/pages/EventsList.tsx
- **Переписан** - использует хук useEvents вместо ручного fetch
- Удалена сложная логика с useRef для отслеживания новых событий
- Добавлена обработка состояний загрузки и ошибок
- Автообновление через React Query refetchInterval

---

## 2026-03-18 - Рефакторинг React Router v7

### Проблема
- Дублирование маршрутов: `routes.ts` не использовался, маршруты были в `entry.client.tsx`
- Установлен лишний пакет `react-router-dom` (в v7 используется только `react-router`)
- ProtectedRoute был нефункционален - просто рендерил children
- `window.location.href` использовался для редиректов (полная перезагрузка страницы)

### Решение
Упрощение архитектуры React Router для CSR SPA.

### Изменения

#### package.json
- Удалён `react-router-dom` из зависимостей

#### src/entry.client.tsx
- Использует `createBrowserRouter` из `react-router`
- Lazy loading страниц через `React.lazy`
- Импорты `AuthHandler` и `PageLoader`

#### src/components/AuthHandler.tsx
- **Создан** - обработчик 401 редиректов на /login

#### src/components/PageLoader.tsx
- **Создан** - компонент индикатора загрузки

#### src/components/ProtectedRoute.tsx
- Удалён (был нефункционален)

#### src/common/httpPrivate.ts
- Убраны `window.location.href` редиректы
- При 401 ошибке просто возвращает Promise.reject

#### src/Layout.tsx
- Удалена обёртка `ClientOnly`

#### src/catchall.tsx
- Изменён импорт: `react-router-dom` → `react-router`

#### vite.config.ts
- Убран `react-router-dom` из `manualChunks`

#### docs/notes.md
- Обновлена документация React Router

### Результат
- Размер бандла `vendor-react`: ~180KB → ~95KB (gzip: 32KB)
- Упрощённая архитектура маршрутизации
- Корректная обработка 401 без полной перезагрузки страницы
- Нет eslint warnings

#### public/index.html
- Удалён синхронный XHR скрипт проверки авторизации
- Теперь проверка 401 обрабатывается в AuthHandler
- Синхронный XHR блокировал UI и создавал лишнюю нагрузку на сервер

#### react-router.config.ts
- Удалён (не используется при CSR с Vite)

#### src/entry.html
- Удалён (не используется при CSR с Vite)

#### package.json
- Удалён `@react-router/dev` из devDependencies
- Изменён скрипт `dev`: `react-router dev` → `vite dev`
- antd: 6.x → 5.21.6 (совместимость с @ant-design/pro-components)

---

## 2026-03-17 - Улучшение безопасности авторизации

### Проблема
- Токены `accessToken` и `refreshToken` сохранялись в localStorage
- С фронтенда отправлялись заголовки `X-Api-Key` и `Authorization`
- Это небезопасно - токены доступны из JavaScript

### Решение
Переход на httpOnly куки для хранения токенов.

### Изменения на фронтенде

#### src/common/httpPrivate.ts
- Убран интерцептор запроса, добавлявший заголовки `X-Api-Key` и `Authorization`
- Удалены функции `setApiKey()`, `getApiKey()`, `clearApiKey()`
- Теперь авторизация работает через httpOnly куки

#### src/pages/loginApp.tsx
- Убран импорт `setApiKey` из httpPrivate
- Упрощена логика входа - токены больше не сохраняются в localStorage
- Сервер отдаёт токены в httpOnly куках, браузер сохраняет их автоматически

#### src/pages/DeviceList.tsx
- Удалена форма ввода API-ключа (была только в dev-режиме)
- Удалены неиспользуемые импорты

### Изменения на бэкенде (Python)

Настройка кук изменена:
```python
# Было:
cookies = {"Set-Cookie": [
    "refreshToken="+jwt_refresh+";SameSite=None;Secure;HttpOnly;Path=/;Max-Age="+maxage2,
    "accessToken="+jwt_access+";SameSite=None;Secure;HttpOnly;Path=/;Max-Age="+maxage1
]}

# Стало:
cookies = {"Set-Cookie": [
    "refreshToken="+jwt_refresh+";SameSite=None;Secure;HttpOnly;Path=/private/refresh/;Max-Age="+maxage2,
    "accessToken="+jwt_access+";SameSite=None;Secure;HttpOnly;Path=/;Max-Age="+maxage1
]}
```

### Результат
- `accessToken` отправляется на все API-запросы (Path=/)
- `refreshToken` отправляется только на `/private/refresh/` (Path=/private/refresh/)
- Токены недоступны из JavaScript (httpOnly)
- Рефреш токена работает корректно при 401 ошибке
