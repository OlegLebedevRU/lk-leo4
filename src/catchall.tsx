// src/catchall.tsx
import { useRouteError } from "react-router";

export default function CatchAll() {
  const error = useRouteError();
  console.error(error);

  return (
    <div style={{ padding: 20 }}>
      <h2>404</h2>
      <p>Страница не найдена</p>
    </div>
  );
}
