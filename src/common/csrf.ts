// src/common/csrf.ts
// CSRF protection utilities

// Имя cookie для CSRF токена (стандартное для Django и некоторых других бэкендов)
const CSRF_COOKIE_NAMES = ['csrftoken', 'XSRF-TOKEN', 'csrf_token'];

/**
 * Получение CSRF токена из cookies
 * Внимание: работает только с не-httpOnly куками
 */
export function getCsrfToken(): string | null {
  // Пробуем разные имена кук
  for (const name of CSRF_COOKIE_NAMES) {
    const matches = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (matches) {
      return matches[2];
    }
  }
  return null;
}

/**
 * Проверка, доступен ли CSRF токен
 */
export function hasCsrfToken(): boolean {
  return getCsrfToken() !== null;
}

/**
 * Заголовок для CSRF токена
 */
export const CSRF_HEADER = 'X-CSRFToken';
