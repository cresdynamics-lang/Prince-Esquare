import { io } from 'socket.io-client';

const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const socketUrl = base.replace(/\/api\/?$/, '') || browserOrigin;

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
});

export const ensureSocket = () => {
  if (!socket.connected) socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};
