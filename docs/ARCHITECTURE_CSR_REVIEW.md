# Анализ архитектуры SPA CSR приложения lk-leo4

**Дата:** 2026-03-18  
**Режим:** Architect  
**Проект:** lk-leo4 (Личный кабинет IoT мониторинга)

---

## 1. Резюме

Приложение **lk-leo4** представляет собой SPA-приложение для мониторинга и управления IoT-устройствами, построенное на современном стеке React 19 + Vite 7. В целом архитектура демонстрирует понимание современных подходов к разработке SPA, однако имеет ряд существенных проблем, снижающих эффективность, масштабируемость и качество кода.

**Общая оценка:** 7/10 (хорошо, но требует улучшений)

---

## 2. Технологический стек

| Компонент | Технология | Версия | Статус |
|-----------|------------|--------|--------|
| Фреймворк | React | 19.2.0 | ✅ Актуально |
| UI-библиотека | Ant Design | 5.21.6 | ✅ Актуально |
| Роутинг | React Router | 7.13.0 | ✅ Актуально |
| Состояние (серверное) | TanStack Query | 5.91.0 | ✅ Актуально |
| HTTP-клиент | Axios | 1.13.6 | ✅ Актуально |
| Сборщик | Vite | 7.1.9 | ✅ Актуально |
| Язык | TypeScript | 5.9.3 | ✅ Актуально |

---

## 3. Сильные стороны архитектуры

### 3.1 Современные подходы к управлению состоянием

**React Query (TanStack Query)** — правильный выбор для SPA CSR:

- Централизованное управление серверным состоянием
- Автоматическое кэширование и инвалидация
- Оптимистические обновления
- Встроенный retry и deduping запросов

Реализация в [`src/providers/QueryProvider.tsx`](src/providers/QueryProvider.tsx:1):
```typescript
const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 минута
      gcTime: 1000 * 60 * 5,     // 5 минут
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
};
```

**Query Keys** — правильная организация в [`src/hooks/useDevices.ts`](src/hooks/useDevices.ts:8):
```typescript
export const devicesKeys = {
  all: ['devices'] as const,
  list: () => [...devicesKeys.all, 'list'] as const,
  detail: (deviceId: string) => [...devicesKeys.all, 'detail', deviceId] as const,
};
```

### 3.2 Code Splitting и Lazy Loading

Настройка в [`vite.config.ts`](vite.config.ts:11):
```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router'],
  'vendor-antd': ['antd', '@ant-design/icons', '@ant-design/pro-components'],
  'vendor-utils': ['axios', 'react-syntax-highlighter'],
}
```

Ленивая загрузка страниц в [`src/entry.client.tsx`](src/entry.client.tsx:12):
```typescript
const HomePage = React.lazy(() => import("./pages/home"));
const LoginPage = React.lazy(() => import("./pages/loginApp"));
```

### 3.3 Feature-based архитектура

Структура `features/` — правильный подход к организации кода:
```
src/features/
├── devices/
│   ├── api/devices.ts      # API методы
│   ├── types.ts            # TypeScript типы
│   └── domain/             # Бизнес-логика
│       └── deviceMapping.ts
├── tasks/
│   ├── api/tasks.ts
│   ├── types.ts
│   └── domain/
│       ├── taskMapping.ts
│       └── statusMapping.tsx
└── events/
    ├── api/events.ts
    ├── types.ts
    └── domain/
        └── eventMapping.ts
```

### 3.4 HTTP-слой с interceptors

Реализация refresh token в [`src/common/httpPrivate.ts`](src/common/httpPrivate.ts:27):
- Waiting list pattern для предотвращения race conditions
- Автоматический retry после refresh
- withCredentials для httpOnly cookies

---

## 4. Проблемы и рекомендации

### 4.1 🔴 Критические проблемы

#### Проблема 1: Смешение подходов к получению данных

**Локация:** [`src/pages/home.tsx`](src/pages/home.tsx:8)

Компонент `home.tsx` использует **гибридный подход** — часть данных получает через React Query хуки, а часть — напрямую через `axiosPrivate`:

```typescript
// home.tsx - смешение подходов
import { axiosPrivate } from '../common/httpPrivate';  // ❌ Прямой вызов

const loadDeviceInfo = async (deviceId: DeviceId) => {
  const response = await axiosPrivate.get(...);  // ❌ Мимо React Query
};
```

**Рекомендация:** Вынести ВСЮ работу с данными в хуки React Query:
- Создать хук `useDeviceInfo(deviceId)` 
- Использовать его вместо прямых вызовов axiosPrivate

#### Проблема 2: Отсутствие Error Boundaries

Приложение не имеет Error Boundaries для graceful обработки ошибок рендеринга.

**Рекомендация:** Добавить Error Boundary на уровне приложения:
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  // ...
}
```

#### Проблема 3: Избыточное логирование в production

**Локация:** [`src/common/httpPrivate.ts`](src/common/httpPrivate.ts:18)

Многочисленные `console.log` в production коде:
```typescript
console.log('AXIOS REQUEST:', config.method?.toUpperCase(), config.url);
console.warn('AXIOS 401 - TRYING REFRESH');
console.log('Token refreshed successfully');
```

**Рекомендация:** 
- Удалить или обернуть в `import.meta.env.DEV`
- Использовать библиотеку логирования (loglevel, Winston)

---

### 4.2 🟠 Важные проблемы

#### Проблема 4: Отсутствие навигации (Layout без меню)

**Локация:** [`src/Layout.tsx`](src/Layout.tsx:1)

Текущий Layout содержит только `ConfigProvider` и не включает навигационное меню:
```typescript
// Текущий Layout - минималистичный
<ConfigProvider ...>
  <ProConfigProvider ...>
    <AntdApp>
      {children}
    </AntdApp>
  </ProConfigProvider>
</ConfigProvider>
```

**Рекомендация:** Добавить навигационное меню с использованием Ant Design ProLayout:
```typescript
import { ProLayout } from '@ant-design/pro-components';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProLayout
      menu={{ items: MENU_ITEMS }}
      rightContentRender={() => <UserInfo />}
    >
      {children}
    </ProLayout>
  );
}
```

#### Проблема 5: URL API захардкожены

**Локация:** [`src/common/config.ts`](src/common/config.ts:16)

DEV и PROD URLs идентичны:
```typescript
const DEV_URLS = { apiV1Url: "https://dev.leo4.ru/api/jwt/v1" };
const PROD_URLS = { apiV1Url: "https://dev.leo4.ru/api/jwt/v1" };  // Ошибка!
```

**Рекомендация:** Использовать environment variables:
```typescript
const urls = isDev ? DEV_URLS : PROD_URLS;
```

Добавить `.env` файлы:
```
VITE_API_URL=https://dev.leo4.ru/api/jwt/v1
```

#### Проблема 6: Отсутствие CSRF защиты

Рекомендация из документации не реализована:
```typescript
// Добавить CSRF token в axios
axiosPrivate.defaults.headers.common['X-CSRF-Token'] = getCsrfToken();
```

---

### 4.3 🟡 Мелкие проблемы

| № | Проблема | Решение |
|---|----------|---------|
| 1 | Нет TypeScript `noUncheckedIndexedAccess` | Включить в tsconfig |
| 2 | Отсутствие тестов | Добавить Vitest + React Testing Library |
| 3 | Нет мета-тегов для SEO | Добавить react-helmet-async |
| 4 | Нет skeleton loaders | Использовать Ant Design Skeleton |

---

## 5. Архитектурные рекомендации

### 5.1 Рекомендуемая структура хуков

```
src/hooks/
├── useDevices.ts      # ✅ Уже есть
├── useTasks.ts        # ✅ Уже есть
├── useEvents.ts       # ✅ Уже есть
├── useDeviceInfo.ts   # ❌ НУЖНО ДОБАВИТЬ (используется в home.tsx)
└── useAuth.ts         # ❌ НУЖНО ДОБАВИТЬ (состояние авторизации)
```

### 5.2 Диаграмма потока данных

```mermaid
graph TD
    A[Компонент] -->|useDevices()| B[React Query]
    B -->|queryFn| C[fetchDevices]
    C -->|axiosPrivate| D[API Server]
    
    E[home.tsx] -->|axiosPrivate| D
    E -->|useDevices| B
    
    style A fill:#90EE90
    style E fill:#FFB6C1
```

---

## 6. Итоговый план улучшений

### Приоритет 1 (Критические)

- [ ] Вынести прямые вызовы axiosPrivate в хуки React Query
- [ ] Добавить Error Boundary
- [ ] Удалить console.log из production кода

### Приоритет 2 (Важные)

- [ ] Исправить конфигурацию DEV/PROD URL
- [ ] Добавить навигационное меню в Layout
- [ ] Реализовать CSRF protection
- [ ] Добавить Suspense с skeleton loaders

### Приоритет 3 (Желательные)

- [ ] Настроить Vitest + React Testing Library
- [ ] Добавить react-helmet-async для SEO
- [ ] Включить строгие проверки TypeScript
- [ ] Добавить документацию API (Swagger UI)

---

## 7. Заключение

Приложение **lk-leo4** имеет современный и в целом правильный технологический стек. Основные сильные стороны — использование React Query, Feature-based архитектура и Code Splitting.

**Ключевые проблемы:**
1. Гибридный подход к получению данных (mix React Query + axios)
2. Отсутствие Error Boundaries
3. Избыточное логирование
4. Ненастроенная навигация
5. Хардкод URL API

После устранения этих проблем архитектура получит оценку **8.5-9/10** и будет готова для масштабирования и долгосрочной поддержки.
