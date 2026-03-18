// src/common/config.ts
// Конфигурация API URL для разных окружений

// Определяем режим: development или production
const isDev = import.meta.env.DEV;

// URLs для dev окружения
const DEV_URLS = {
  apiBaseUrl: "https://dev.leo4.ru",
  publicApiUrl: "https://dev.leo4.ru/public",
  privateApiUrl: "https://dev.leo4.ru/private",
  apiV1Url: "https://dev.leo4.ru/api/jwt/v1",
};

// URLs для prod окружения
const PROD_URLS = {
  apiBaseUrl: "https://dev.leo4.ru",
  publicApiUrl: "https://dev.leo4.ru/public",
  privateApiUrl: "https://dev.leo4.ru/private",
  apiV1Url: "https://dev.leo4.ru/api/jwt/v1",
};

// Выбираем конфиг в зависимости от режима
const urls = isDev ? DEV_URLS : PROD_URLS;

export const config = {
  // Основной базовый URL
  apiBaseUrl: urls.apiBaseUrl,
  
  // URL для публичных запросов
  publicApiUrl: urls.publicApiUrl,
  
  // URL для приватных запросов (с credentials)
  privateApiUrl: urls.privateApiUrl,
  
  // URL для API v1
  apiV1Url: urls.apiV1Url,

  // Sitekey для Яндекс Капчи
  captchaSitekey: "ysc1_VbSsmUimGfekCT8aaUV3FLdYszcXiqThvipST2X67ad609f0",
  
  // Флаг режима разработки
  isDev,

  // Включить тестовый режим капчи (не требует загрузки скрипта)
  captchaTestMode: isDev,
} as const;

export type Config = typeof config;
