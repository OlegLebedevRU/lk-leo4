# Настройка CSRF на бэкенде (FastAPI/Starlette)

## Требования

Для работы CSRF protection нужен бэкенд на FastAPI или Starlette.

## Установка зависимости

```bash
pip install starlette-csrf
```

## Настройка в main.py

```python
from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from starlette.csrf import CSRFMiddleware

app = FastAPI()

# 1. Добавить SessionMiddleware (обязательно для CSRF)
app.add_middleware(
    SessionMiddleware,
    secret_key="your-secret-key-change-in-production"
)

# 2. Добавить CSRF middleware
app.add_middleware(
    CSRFMiddleware,
    secret_key="your-csrf-secret-key-change-in-production"
)
```

## Настройка CORS

Важно: при использовании CSRF с credentials:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,  # Важно!
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Как это работает

1. При первом запросе сервер устанавливает cookie `csrftoken`
2. Фронтенд читает этот токен из cookie
3. При мутирующих запросах (POST, PUT, PATCH, DELETE) фронтенд отправляет токен в заголовке `X-CSRFToken`
4. Бэкенд проверяет токен и разрешает/отклоняет запрос

## Проверка

После настройки можно проверить:
- Откройте DevTools → Application → Cookies
- Должна появиться кука `csrftoken`

## Временное решение

Пока бэкенд не настроен, CSRF токен будет пустым, запросы продолжат работать, но без защиты.
