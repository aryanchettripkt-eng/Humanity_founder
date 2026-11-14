import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAuthToken } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;
const statusListeners = new Set<(connected: boolean) => void>();

export function connectSocket(): Socket | null {
  const token = getAuthToken();
  if (!token) return null;

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnectionAttempts: 10,
  });

  const notify = () => {
    const ok = Boolean(socket?.connected);
    statusListeners.forEach((fn) => fn(ok));
  };

  socket.on('connect', notify);
  socket.on('disconnect', notify);

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    statusListeners.forEach((fn) => fn(false));
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function useSocketConnected(): boolean {
  const [connected, setConnected] = useState<boolean>(() => Boolean(socket?.connected));

  useEffect(() => {
    setConnected(Boolean(socket?.connected));
    statusListeners.add(setConnected);
    return () => {
      statusListeners.delete(setConnected);
    };
  }, []);

  return connected;
}

export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void): void {
  useEffect(() => {
    const s = socket;
    if (!s) return;
    s.on(event, handler);
    return () => {
      s.off(event, handler);
    };
  }, [event, handler]);
}

