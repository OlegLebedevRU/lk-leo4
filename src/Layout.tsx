// Layout.tsx - Упрощённый Layout для CSR
import { App as AntdApp, ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import { ProConfigProvider, ruRUIntl } from "@ant-design/pro-components";
import { theme } from "antd";
import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={ruRU} theme={{ algorithm: theme.compactAlgorithm }}>
      <ProConfigProvider intl={ruRUIntl}>
        <AntdApp>
          {children}
        </AntdApp>
      </ProConfigProvider>
    </ConfigProvider>
  );
}
