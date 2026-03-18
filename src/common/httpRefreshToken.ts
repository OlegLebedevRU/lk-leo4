// src/common/httpRefreshToken.ts
import axios from "axios";
import { config } from "./config";
import { getCsrfToken, CSRF_HEADER } from "./csrf";

// Флаг для предотвращения множественных одновременных попыток рефреша
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const refreshTokenFn = async (): Promise<boolean> => {
  // Если уже идёт рефреш - ждём его результат
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  
  refreshPromise = (async () => {
    // Не проверяем document.cookie - он не видит HttpOnly куки
    // axios с withCredentials отправляет их автоматически
    
    try {
      // Используем GET для refresh
      await axios.get(`${config.privateApiUrl}/refresh/`, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER]: getCsrfToken() || '',
        },
      });

      return true;
    } catch (error) {
      const err = error as Error;
      if (import.meta.env.DEV) {
        console.error("error refreshToken:", err.message);
      }
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const refreshToken = refreshTokenFn;
