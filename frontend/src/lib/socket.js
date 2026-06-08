// MODIFIED — Socket.io client (live stock updates)
import { io } from 'socket.io-client';

const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const socketUrl = base.replace(/\/api\/?$/, '') || 'http://localhost:8000';

export const socket = io(socketUrl, {
  autoConnect: false,
  // Polling first avoids noisy WebSocket errors when the API is restarting.
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 4,
  reconnectionDelay: 3000,
  reconnectionDelayMax: 12000,
  timeout: 15000,
});

let listenersAttached = false;

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

/** Attach socket listeners once; connects only when staff/admin pages need live updates. */
export const ensureSocket = (onConnect) => {
  connectSocket();
  if (!listenersAttached) {
    listenersAttached = true;
    socket.io.on('error', () => {});
    socket.on('connect_error', () => {});
  }
  if (onConnect) onConnect();
  return socket;
};
