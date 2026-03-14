// src/common/httpPrivate.ts
import axios from "axios";
import { memoizedRefreshToken } from "./httpRefreshToken";

// Базовая настройка без X-Api-Key /test
axios.defaults.baseURL = "https://dev.leo4.ru/api/v1";
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.withCredentials = true;

// Интерцептор запроса: добавляем API-ключ, если есть
axios.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem("api-key") || "";
    config.headers["X-Api-Key"] = apiKey;
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор ответа: обработка 401 и refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;

    if (!error.response) {
      console.error('CORS or network error:', error.message);
    } else if (error.response.status === 401 && !config?.sent) {
      config.sent = true;
      const result = await memoizedRefreshToken();
      if (result) {
        return axios(config);
      }
    }
    return Promise.reject(error);
  }
);

export const axiosPrivate = axios;

// Экспортируем функцию для установки ключа
export const setApiKey = (key: string) => {
  localStorage.setItem("api-key", key);
};

// Экспортируем функцию для получения ключа
export const getApiKey = (): string => {
  return localStorage.getItem("api-key") || "";
};