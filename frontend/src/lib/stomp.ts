import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/api/ws';

export function createStompClient(token?: string): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 3000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: process.env.NODE_ENV === 'development' ? (msg) => console.debug('[STOMP]', msg) : undefined,
  });
  return client;
}

export type { IMessage };
