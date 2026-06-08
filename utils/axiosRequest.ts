import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const axiosLogin = axios.create({
  baseURL: "https://melodious-friendship-production-e718.up.railway.app",
});

export const axiosRequest = axios.create({
  baseURL: "https://melodious-friendship-production-e718.up.railway.app",
});

axiosRequest.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem("access_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
