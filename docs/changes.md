# История изменений

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
