import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const connectersRef = useRef({});

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.on('connect', () => {
      console.log('✓ Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('✗ Socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected');
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      // Store for cleanup
      connectersRef.current[event] = callback;
    }
  }, []);

  const off = useCallback((event) => {
    if (socketRef.current && connectersRef.current[event]) {
      socketRef.current.off(event, connectersRef.current[event]);
      delete connectersRef.current[event];
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
  };
};
