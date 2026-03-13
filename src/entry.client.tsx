// entry.client.tsx
import { createRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import "./index.css";
import React from "react";

const container = document.body;

// Вместо hydrateRoot — используем createRoot
createRoot(container).render(
  <React.StrictMode>
    <HydratedRouter />
  </React.StrictMode>
);