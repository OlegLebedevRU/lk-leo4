// src/common/httpPublic.ts
import axios from "axios";
import { config } from "./config";

export const axiosPublic = axios.create({
  baseURL: config.publicApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});
