import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Публичные маршруты - без layout
  route("/login", "./pages/login.tsx"),
  
  // Защищённые маршруты - с layout
  layout("./Layout.tsx", [
    index("./pages/home.tsx"),
    // Здесь можно добавить будущие защищённые маршруты
    // route("tasks", "./pages/TasksList.tsx"),
    // route("devices", "./pages/DeviceList.tsx"),
  ]),
  
  // Catchall для 404
  route("*", "./catchall.tsx"),
] satisfies RouteConfig;
