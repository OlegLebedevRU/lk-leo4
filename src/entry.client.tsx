// entry.client.tsx - Использует React Router v7
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router";
import "./index.css";
import React, { Suspense } from "react";
import { AuthHandler } from "./components/AuthHandler";
import { PageLoader } from "./components/PageLoader";
import { Layout } from "./Layout";
import { QueryProvider } from "./providers/QueryProvider";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy-loaded страницы
const HomePage = React.lazy(() => import("./pages/home"));
const LoginPage = React.lazy(() => import("./pages/loginApp"));
const CatchAll = React.lazy(() => import("./catchall"));

/* eslint-disable react-refresh/only-export-components */
// Обертка для применения Layout с ленивой загрузкой
function PageWithLayout({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Layout>
        <Component />
      </Layout>
    </Suspense>
  );
}

// Определяем маршруты с Layout
const router = createBrowserRouter([
  {
    path: "/",
    element: <PageWithLayout component={HomePage} />,
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<PageLoader />}>
        <Layout>
          <CatchAll />
        </Layout>
      </Suspense>
    ),
  },
]);

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <AuthHandler />
        <RouterProvider router={router} />
      </QueryProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
