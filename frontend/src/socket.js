import { io } from "socket.io-client";
import BASE_URL from "./api";

export const createSocket = (token) => {
  return io(BASE_URL, {
    auth: { token }
  });
};