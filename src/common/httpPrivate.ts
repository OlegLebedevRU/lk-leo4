// src/common/httpPrivate.ts
import axios from "axios";
import { config as appConfig } from "./config";
import { refreshToken } from "./httpRefreshToken";

// Базовая настройка без X-Api-Key
axios.defaults.baseURL = appConfig.apiV1Url;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.withCredentials = true;  // Использовать cookies

// Глобальный флаг - идёт ли сейчас рефреш
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Интерцептор запроса: просто логируем запрос
axios.interceptors.request.use(
  (config) => {
    console.log('AXIOS REQUEST:', config.method?.toUpperCase(), config.url);
    
    // Токен в HttpOnly cookie - браузер отправляет автоматически
    config.withCredentials = true;
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
      console.error('CORS or network error:', error.message);
      return Promise.reject(error);
    }
    
    const status = error.response.status;
    const contentType = error.response.headers?.['content-type'] || '';
    
    console.warn('AXIOS ERROR:', status, 'content-type:', contentType);
    
    // Если 401 - пробуем рефреш
    if (status === 401) {
      // НЕ пытаемся рефрешить для самого refresh endpoint
      if (originalRequest.url?.includes('/refresh/')) {
        console.log('Refresh endpoint returned 401 - no valid refresh token, redirecting to /login');
        window.location.href = '/login?from=refresh';
        return Promise.reject(error);
      }
      
      // Если уже рефрешим - ждём результата
      if (isRefreshing && refreshPromise) {
        console.log('Already refreshing, waiting for result...');
        const success = await refreshPromise;
        if (success) {
          return axios(originalRequest);
        } else {
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
      
      // Проверяем, не делали ли мы уже рефреш для этого запроса
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        isRefreshing = true;
        
        console.warn('AXIOS 401 - TRYING REFRESH');
        
        refreshPromise = (async () => {
          try {
            // Пытаемся обновить токен
            const refreshSuccess = await refreshToken();
            
            if (refreshSuccess) {
              console.log('Token refreshed successfully');
            } else {
              console.log('Token refresh failed');
            }
            return refreshSuccess;
          } catch (refreshError) {
            console.error('Error during token refresh:', refreshError);
            return false;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();
        
        const refreshSuccess = await refreshPromise;
        
        if (refreshSuccess) {
          console.log('Retrying request after refresh');
          return axios(originalRequest);
        } else {
          console.log('Refresh failed, redirecting to /login');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } else {
        console.log('Already retried, redirecting to /login');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    // Другие ошибки - не редиректим, а возвращаем ошибку для обработки в компоненте
    // window.location.href = '/login';
    return Promise.reject(error);
  }
);

export const axiosPrivate = axios;
