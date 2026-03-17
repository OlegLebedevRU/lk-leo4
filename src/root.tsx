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
      <Outlet />
    </Layout>
  );
}
