import axios from "axios";
import { attachErrorhInterceptor } from "../interceptors/errorInterceptor";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

attachErrorhInterceptor(api);

export default api;
