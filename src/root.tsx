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
import { theme } from "antd";
// src/root.tsx
export function HydrateFallback() {
  return <p>Loading...</p>;
}
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Meta />
      <Links />
      <ConfigProvider locale={ruRU} theme={{ algorithm: theme.compactAlgorithm }}>
        <AntdApp>
          {children}
        </AntdApp>
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