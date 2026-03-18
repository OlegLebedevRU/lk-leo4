// entry.client.tsx - Использует React Router v7
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router";
import "./index.css";
import React, { Suspense } from "react";
import { AuthHandler } from "./components/AuthHandler";
import { PageLoader } from "./components/PageLoader";

// Lazy-loaded страницы
const HomePage = React.lazy(() => import("./pages/home"));
const LoginPage = React.lazy(() => import("./pages/login"));
const CatchAll = React.lazy(() => import("./catchall"));

// Определяем маршруты
const router = createBrowserRouter([
  { path: "/login", element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
  { path: "/", element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense> },
  { path: "*", element: <Suspense fallback={<PageLoader />}><CatchAll /></Suspense> },
]);

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

createRoot(container).render(
  <React.StrictMode>
    <AuthHandler />
    <RouterProvider router={router} />
  </React.StrictMode>
);
