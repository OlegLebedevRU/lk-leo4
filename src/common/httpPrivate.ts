import axios from "axios";
import { memoizedRefreshToken } from "./httpRefreshToken";

axios.defaults.baseURL = "https://dev.leo4.ru/private";
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.interceptors.request.use(
  async (config) => {
    config = { ...config,withCredentials:true, };
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    if (error?.response?.status === 401 && !config?.sent) {
      config.sent = true;
      const result = await memoizedRefreshToken();
      if (result) {
        config.withCredentials=true;
        config.headers = {...config.headers,};
      }
      return axios(config);
    }
    return Promise.reject(error);
  }
);

export const axiosPrivate = axios;