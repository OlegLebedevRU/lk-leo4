// entry.client.tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router-dom";
import React from "react";
import "./index.css";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/login";
import Home from "./pages/home";

// Static routes (no lazy loading for debugging)
const routes = [
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "*",
    Component: Home,
  },
];

// Component that renders routes
export function AppRoutes() {
  console.log("AppRoutes: rendering, pathname =", window.location.pathname);
  const element = useRoutes(routes);
  console.log("AppRoutes: element =", element);
  return element;
}

const container = document.getElementById("root");

console.log("Entry client: container =", container);

if (!container) {
  throw new Error("Root element not found");
}

console.log("Entry client: calling createRoot");

const root = createRoot(container);

console.log("Entry client: calling render");

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ProtectedRoute>
        <AppRoutes />
      </ProtectedRoute>
    </BrowserRouter>
  </React.StrictMode>
);
