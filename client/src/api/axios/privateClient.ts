import axios from "axios";
import { attachAuthInterceptor } from "../interceptors/authInterceptor";

const privateClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

attachAuthInterceptor(privateClient);

export default privateClient;
