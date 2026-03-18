// src/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router-dom";
import { App as AntdApp, ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import { ProConfigProvider, ruRUIntl } from "@ant-design/pro-components";
import { theme } from "antd";
import React, { Suspense, useState, useEffect } from "react";

// ClientOnly - рендерит контент только на клиенте
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Используем requestAnimationFrame для избежания двойного рендера
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return <>{children}</>;
}

// src/root.tsx
export function HydrateFallback() {
  return <p>Loading...</p>;
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Токен в HttpOnly cookie - не можем проверить
  // Рендерим всё без редиректов
  
  return (
    <>
      <Meta />
      <Links />
      <ConfigProvider locale={ruRU} theme={{ algorithm: theme.compactAlgorithm }}>
        <ProConfigProvider intl={ruRUIntl}>
          <AntdApp>
            {children}
          </AntdApp>
        </ProConfigProvider>
      </ConfigProvider>
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

export default function Root() {
  return (
    <Layout>
      <Suspense fallback={<HydrateFallback />}>
        <ClientOnly>
          <Outlet />
        </ClientOnly>
      </Suspense>
    </Layout>
  );
}
