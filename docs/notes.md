# Documentation / Документация

## Деплой и инфраструктура

### Сборка

Локальная сборка:
```bash
npm run build
```

Результат: папка `dist/`

### Деплой

PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

**Скрипт deploy.ps1 (полный деплой с билдом):**
1. Запускает `npm run build`
2. Проверяет наличие index.html
3. **Проверяет конфигурацию nginx** через `docker compose exec nginx nginx -T`
4. При наличии `try_files ... index.html` в конфиге - НЕ создаёт login/index.html
5. При отсутствии try_files - создаёт login/index.html для совместимости
6. Копирует favicon.svg в dist
7. Загружает файлы на сервер через SCP

**Скрипт deploy-upload.ps1 (только аплоад, без билда):**
```powershell
powershell -ExecutionPolicy Bypass -File deploy-upload.ps1
```
1. Проверяет dist папку
2. **Проверяет конфигурацию nginx** аналогично deploy.ps1
3. Загружает файлы на сервер через SCP
4. Перезапускает nginx контейнер

#### Логика проверки nginx

Скрипты проверяют конфигурацию nginx для определения SPA-совместимости:

```powershell
ssh -i "d:\.ssh\free-tier-cloud_ru" user1@176.108.247.249 "cd /home/user1/iot-rpc-rest-app && sudo docker compose exec nginx nginx -T"
```

- Если найден `try_files $uri $uri/ /index.html` → маршрутизация работает на стороне клиента, login/index.html не нужен
- Если конфиг не содержит try_files → создаётся login/index.html для совместимости

### SSH команды (PowerShell)

Подключение к серверу:
```powershell
ssh user1@dev.leo4.ru
```

Выполнить команду на сервере:
```powershell
ssh user1@dev.leo4.ru "docker-compose restart nginx"
```

Перезапуск контейнера:
```powershell
ssh user1@leo4-free-tier "docker-compose restart nginx"
```

### SCP команды (PowerShell)

Загрузить файл на сервер:
```powershell
scp dist/index.html user1@dev.leo4.ru:/var/share/nginx/html/
```

Загрузить директорию:
```powershell
scp -r dist/* user1@dev.leo4.ru:/var/share/nginx/html/
```

Скачать файл с сервера:
```powershell
scp user1@dev.leo4.ru:/var/share/nginx/html/index.html ./
```

### Docker-compose

```bash
# Статус контейнеров
docker compose ps

# Логи nginx
docker compose logs nginx

# Перезапуск nginx
docker compose restart nginx

# Посмотреть конфиг nginx
docker compose exec nginx nginx -T

# Перезагрузка конфига nginx
docker compose exec nginx nginx -s reload
```

### Nginx конфигурация для SPA

```nginx
# Основной location для SPA
location / {
    auth_jwt_enabled off;
    root /var/share/nginx/html;
    try_files $uri /index.html;
}

# Отдельный location для /login
location = /login {
    auth_jwt_enabled off;
    root /var/share/nginx/html;
    try_files $uri /login/index.html;
}

# Статика (assets)
location /assets/ {
    auth_jwt_enabled off;
    root /var/share/nginx/html;
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}
```

### Vite конфигурация

Файл: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
```

Ключевые моменты:
- `ssr: false` не требуется явно - Vite по умолчанию для клиентского рендеринга
- `base: '/'` - для работы на корне домена
- `outDir: 'dist'` - директория для билда

### React Router

Файл: `src/routes.ts`

```typescript
export const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/devices', element: <DeviceList /> },
  { path: '/tasks', element: <TasksList /> },
  { path: '/events', element: <EventsList /> },
];
```

Использование в `entry.client.tsx`:

```typescript
import { useRoutes } from 'react-router-dom';
import { routes } from './routes';

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}
```

### Архитектура приложения

```
src/
├── entry.client.tsx    # Точка входа (hydrates React)
├── root.tsx            # Корневой компонент с Layout
├── routes.ts           # Определение маршрутов
├── catchall.tsx        # Catch-all для SPA
├── common/
│   ├── config.ts       # Конфигурация API
│   ├── httpPrivate.ts # Axios с интерцепторами, 401 обработка
│   ├── httpPublic.ts   # Публичный axios без токена
│   └── httpRefreshToken.ts # Обновление токена
├── components/
│   └── ProtectedRoute.tsx # Защита маршрутов
└── pages/
    ├── loginApp.tsx    # Форма логина
    ├── home.tsx        # Главная страница
    ├── DeviceList.tsx  # Список устройств
    ├── TasksList.tsx   # Список задач
    ├── EventsList.tsx  # Список событий
    ├── DeviceTags.tsx  # Теги устройств
    └── CreateNewTask.tsx # Создание задачи
```

### Аутентификация

Токен хранится в HttpOnly cookie (недоступен для JavaScript).

Проверка аврутентификации:
- На уровне nginx через `auth_jwt`
- При 401 от API -> редирект на /login

Файлы:
- `src/common/httpPrivate.ts` - интерцептор для 401
- `src/components/ProtectedRoute.tsx` - проверка маршрутов
- `src/pages/loginApp.tsx` - форма логина

---

## JWT Токены и API

### Типы токенов

| Токен | Хранение | Использование |
|-------|----------|---------------|
| `accessToken` | HttpOnly Cookie + localStorage | Авторизация запросов к `/api/jwt/v1/` |
|  `refreshToken` | HttpOnly Cookie | Обновление accessToken через `/private/refresh/` |
| `X-Api-Key` | localStorage | Авторизация для `/api/key/v1/` и legacy `/api/v1/` |

### Конфигурация URL API

Файл: [`src/common/config.ts`](../src/common/config.ts)

```typescript
const PROD_URLS = {
  apiBaseUrl: "https://dev.leo4.ru",
  publicApiUrl: "https://dev.leo4.ru/public",
  privateApiUrl: "https://dev.leo4.ru/private",
  apiV1Url: "https://dev.leo4.ru/api/jwt/v1",
};
```

### Фронтенд: HTTP клиенты

#### httpPrivate.ts

Файл: [`src/common/httpPrivate.ts`](../src/common/httpPrivate.ts)

- Базовый URL: `config.apiV1Url` → `https://dev.leo4.ru/api/jwt/v1`
- `withCredentials: true` - отправляет cookies
- Интерцептор запроса: добавляет `X-Api-Key` и `Authorization: Bearer` из localStorage
- Интерцептор ответа: при 401 автоматически вызывает refresh

```typescript
// Добавление токенов к запросу
const apiKey = localStorage.getItem('api-key');
const accessToken = localStorage.getItem('accessToken');
config.headers['X-Api-Key'] = apiKey;
config.headers['Authorization'] = `Bearer ${accessToken}`;
```

#### httpRefreshToken.ts

Файл: [`src/common/httpRefreshToken.ts`](../src/common/httpRefreshToken.ts)

- URL: `${config.privateApiUrl}/refresh/` → `https://dev.leo4.ru/private/refresh/`
- Метод: GET
- `withCredentials: true` - автоматически отправляет HttpOnly refresh cookie

---

## Nginx Locations

### Общая структура

| Location | Путь | Auth | Описание |
|----------|------|------|----------|
| `/public/login/` | regex | OFF | Публичный логин |
| `/private/refresh/` | exact | OFF | Обновление токена |
| `/api/jwt/v1/` | regex | JWT (cookie) | Фронтенд API с JWT |
| `/api/key/v1/` | regex | X-API-Key | Внешние сервисы |
| `/api/v1/` | regex | X-API-Key | Legacy API |
| `/docs/` | regex | OFF | Swagger документация |
| `/login` | exact | OFF | SPA страница логина |
| `/assets/` | prefix | OFF | Статика |
| `/` | prefix | OFF | Основной SPA |

### JWT Configuration (nginx)

```nginx
# Глобальные настройки
auth_jwt_enabled on;
auth_jwt_algorithm RS256;
auth_jwt_redirect off;

# Публичный ключ для валидации JWT
auth_jwt_key "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----";
```

### Location: /public/login/

Публичный endpoint для аутентификации пользователей.

```nginx
location ~ ^/public/login/?$ {
    auth_jwt_enabled off;
    
    # CORS заголовки
    add_header Access-Control-Allow-Origin $allowed_cors_origins always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    
    # Проксирование к бэкенду
    rewrite ^/public/login/?$ /account/login break;
    proxy_pass https://leo4_cloud;
}
```

### Location: /private/refresh/

Endpoint для обновления access token. **Отключен JWT** - проверка выполняется бэкендом через HttpOnly cookie.

```nginx
location = /private/refresh/ {
    auth_jwt_enabled off;
    
    # Проксирование
    rewrite ^ /account/refresh/ break;
    proxy_pass https://leo4_cloud;
    
    # Критично: очищаем Origin
    proxy_set_header Origin "";
}
```

### Location: /api/jwt/v1/

Основной API для фронтенда с JWT авторизацией через cookie.

```nginx
location ~ ^/api/jwt/v1/(?<api_path>.*)$ {
    # JWT из COOKIE
    auth_jwt_location COOKIE=accessToken;
    auth_jwt_extract_var_claims orgId;
    
    # Извлечение orgId из JWT claim в заголовок
    proxy_set_header orgId $jwt_claim_orgId;
    
    # Передача X-API-Key
    proxy_set_header X-API-Key $http_x_api_key;
    
    # Проксирование
    proxy_pass http://backend_app/api/v1/$api_path$is_args$args;
}
```

**Особенности:**
- JWT токен читается из cookie `accessToken`
- `orgId` автоматически извлекается из JWT claim и передаётся в заголовке `orgId`
- CORS разрешён для `localhost:5173` и `dev.leo4.ru`

### Location: /api/key/v1/

API для внешних сервисов с авторизацией через `X-API-Key` заголовок.

```nginx
location ~ ^/api/key/v1/(?<api_path>.*)$ {
    auth_jwt_enabled off;
    
    # Обязательный X-API-Key
    if ($http_x_api_key = "") {
        return 401 "Unauthorized: X-API-Key required\n";
    }
    
    proxy_set_header X-API-Key $http_x_api_key;
    proxy_pass http://backend_app/api/v1/$api_path$is_args$args;
}
```

### Location: /api/v1/

Legacy API с авторизацией через `X-API-Key`.

```nginx
location ~ ^/api/v1/(?<api_path>.*)$ {
    auth_jwt_enabled off;
    
    if ($http_x_api_key = "") {
        return 401 "Unauthorized: X-API-Key required for legacy /api/v1/*\n";
    }
    
    proxy_set_header X-API-Key $http_x_api_key;
    proxy_pass http://backend_app/api/v1/$api_path$is_args$args;
}
```

### CORS заголовки

Разрешённые origins:
```nginx
if ($http_origin ~* ^(https?://localhost:5173|https://dev\.leo4\.ru)$) {
    set $allowed_cors_origins $http_origin;
}
```

Allowed headers:
```
Authorization, Origin, Content-Type, Accept, Connection, 
X-API-Key, orgId, org_id, DNT, User-Agent, X-Requested-With, 
If-Modified-Since, Cache-Control, Range
```

### Безопасность

Запрещена подмена orgId:
```nginx
if ($http_orgId) {
    return 403 "Forbidden: setting 'orgId' header is not allowed\n";
}
```

---

## Поток авторизации

```
1. Пользователь -> /public/login/ -> Бэкенд
2. Бэкенд -> HttpOnly cookies: accessToken, refreshToken
3. Фронтенд -> GET /api/jwt/v1/... 
   -> nginx: auth_jwt cookie=accessToken 
   -> Извлекает orgId из JWT 
   -> Проксирует с заголовком orgId
4. При 401 -> Фронтенд вызывает /private/refresh/
   -> Бэкенд обновляет токены
5. Фронтенд -> Повторяет исходный запрос
```

### Локализация (antd)

Для русского языка:

```typescript
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';

<ConfigProvider locale={ruRU}>
  <App />
</ConfigProvider>
```

В `src/root.tsx` уже настроено:
```typescript
import ruRU from 'antd/locale/ru_RU';

<ConfigProvider locale={ruRU} theme={{ algorithm: theme.compactAlgorithm }}>
  <AntdApp>{children}</AntdApp>
</ConfigProvider>
```

Для пагинации в ProTable добавить `showTotal`:
```typescript
pagination={{
  pageSize: 10,
  showTotal: (total: number) => `Всего: ${total}`,
}}
```

---

## METHOD_CODES - Конфигурация методов задач

Конфигурация method codes хранится в JSON файле [`src/features/tasks/domain/methodCodes.json`](../src/features/tasks/domain/methodCodes.json).

### Структура JSON

```json
{
  "methodCodes": [
    {
      "code": 16,
      "label": "16 - Привязка карты/пинкода к слоту",
      "description": "Привязка ID карты/пинкода к слоту/ячейке",
      "dropdownTooltip": "Привязка ID карты/пинкода к слоту/ячейке",
      "supportsMultiple": true,
      "dtFormat": "objectArray",
      "dtFields": [...]
    }
  ]
}
```

### Ограничения формата dt

Для новых записей формат списка `dt` строго ограничен:

| dtFormat | Результат | Пример |
|----------|-----------|--------|
| `objectArray` | Список объектов | `[{cd: "123", cl: 1}]` |
| `stringArray` | Список строк | `["pin123"]` |
| `numberArray` | Список целых чисел | `[1, 2, 3]` |
| `empty` | Пустой массив | `[]` |

### Как добавить новый method code

1. Откройте файл [`src/features/tasks/domain/methodCodes.json`](../src/features/tasks/domain/methodCodes.json)
2. Добавьте новую запись в массив `methodCodes`:

```json
{
  "code": 99,
  "label": "99 - Новый метод",
  "description": "Описание метода",
  "dropdownTooltip": "Подсказка в выпадающем списке",
  "dtFormat": "stringArray",
  "dtFields": [
    {
      "fieldName": "dt_value",
      "label": "Значение",
      "type": "string",
      "defaultValue": "",
      "example": "пример",
      "tooltip": "Подсказка"
    }
  ]
}
```

#### Параметры method code

| Параметр | Тип | Описание |
|----------|-----|----------|
| `code` | number | Уникальный код метода |
| `label` | string | Отображаемое название |
| `description` | string | Описание метода |
| `dropdownTooltip` | string | Подсказка в выпадающем списке |
| `dtFormat` | string | Формат dt: `objectArray`, `stringArray`, `numberArray`, `empty` |
| `objectField` | string | Имя поля для objectArray (например, `mt` для `{mt: value}`) |
| `supportsMultiple` | boolean | Поддержка множественных объектов |
| `dtFields` | array | Поля для ввода |

#### Параметры dtFields

| Параметр | Тип | Описание |
|----------|-----|----------|
| `fieldName` | string | Имя поля в форме |
| `label` | string | Отображаемое название |
| `type` | string | Тип: `string`, `number`, `numberArray`, `stringArray` |
| `defaultValue` | any | Значение по умолчанию |
| `example` | string | Пример значения |
| `tooltip` | string | Подсказка |
| `group` | string | Группа полей |

### Важные ограничения

1. **Существующие записи не меняют структуру** - добавление новых method codes не влияет на уже созданные задачи
2. **Строгая типизация dt** - формат списка dt всегда один из: `objectArray`, `stringArray`, `numberArray`, `empty`
3. **Обратная совместимость** - все существующие method codes (16, 20, 21, 35, 47) работают без изменений
