// src/components/AuthHandler.tsx - Обработчик 401 редиректов
import { useEffect } from "react";
import { axiosPrivate } from "../common/httpPrivate";

export function AuthHandler() {
  useEffect(() => {
    const interceptor = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
    return () => { axiosPrivate.interceptors.response.eject(interceptor); };
  }, []);
  return null;
}
