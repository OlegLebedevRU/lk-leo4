import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  // * matches all URLs, the ? makes it optional so it will match / as well
  index("./pages/home.tsx"),
  route("*?", "catchall.tsx"),
  route("/login", "./pages/login.tsx"),
] satisfies RouteConfig;