# История изменений

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
