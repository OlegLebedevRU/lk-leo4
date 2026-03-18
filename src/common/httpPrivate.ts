// src/common/httpPrivate.ts
import axios from "axios";
import { config as appConfig } from "./config";
import { refreshToken } from "./httpRefreshToken";
import { getCsrfToken, CSRF_HEADER } from "./csrf";

// Методы, требующие CSRF токен
const CSRF_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Базовая настройка без X-Api-Key
axios.defaults.baseURL = appConfig.apiV1Url;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.withCredentials = true;  // Использовать cookies

// Глобальный флаг - идёт ли сейчас рефреш
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Интерцептор запроса
axios.interceptors.request.use(
  (config) => {
    // Токен в HttpOnly cookie - браузер отправляет автоматически
    config.withCredentials = true;
    
    // Добавляем CSRF токен для мутирующих запросов
    if (CSRF_METHODS.includes(config.method?.toUpperCase() || '')) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers[CSRF_HEADER] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор ответа: обработка 401 и refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если нет ответа (CORS или ошибка сети)
    if (!error.response) {
      if (import.meta.env.DEV) {
        console.error('CORS or network error:', error.message);
      }
      return Promise.reject(error);
    }
    
    const status = error.response.status;
    
    // Если 401 - пробуем рефреш
    if (status === 401) {
      // НЕ пытаемся рефрешить для самого refresh endpoint
      if (originalRequest.url?.includes('/refresh/')) {
        // Не редиректим - предоставим AuthHandler обработать
        return Promise.reject(error);
      }
      
      // Если уже рефрешим - ждём результата
      if (isRefreshing && refreshPromise) {
        const success = await refreshPromise;
        if (success) {
          return axios(originalRequest);
        } else {
          return Promise.reject(error);
        }
      }
      
      // Проверяем, не делали ли мы уже рефреш для этого запроса
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        isRefreshing = true;
        
        refreshPromise = (async () => {
          try {
            // Пытаемся обновить токен
            const refreshSuccess = await refreshToken();
            return refreshSuccess;
          } catch (refreshError) {
            if (import.meta.env.DEV) {
              console.error('Error during token refresh:', refreshError);
            }
            return false;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();
        
        const refreshSuccess = await refreshPromise;
        
        if (refreshSuccess) {
          return axios(originalRequest);
        } else {
          return Promise.reject(error);
        }
      } else {
        return Promise.reject(error);
      }
    }
    
    // Другие ошибки - не редиректим, а возвращаем ошибку для обработки в компоненте
    return Promise.reject(error);
  }
);

export const axiosPrivate = axios;
