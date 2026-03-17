// src/components/ProtectedRoute.tsx
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Токен в HttpOnly cookie - JS не может его прочитать
  // Но браузер автоматически отправляет cookie с запросами
  // ProtectedRoute не может определить статус авторизации
  // Рендерим children - API запросы сами обработают ошибки
  
  return <>{children}</>;
}
