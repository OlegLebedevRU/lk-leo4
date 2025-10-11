import axios from "axios";

export const axiosPublic = axios.create({
  baseURL: "https://dev.leo4.ru/public",
  headers: {
    "Content-Type": "application/json",
  },
});