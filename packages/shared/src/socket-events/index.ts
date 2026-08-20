import type { ChatMessage } from "../types/message";

/**
 * Canonical Socket.IO event names shared by apps/web and apps/api.
 * Import these constants instead of typing raw strings so a typo
 * becomes a compile error instead of a silent dropped listener.
 */
export const SOCKET_EVENTS = {
  // connection lifecycle
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",

  // outbound (client -> server)
  MESSAGE_SEND: "message:send",
  MESSAGE_STOP: "message:stop",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // inbound (server -> client)
  MESSAGE_ACK: "message:ack",
  MESSAGE_STREAM_START: "message:stream:start",
  MESSAGE_STREAM_CHUNK: "message:stream:chunk",
  MESSAGE_STREAM_END: "message:stream:end",
  MESSAGE_STREAM_STOPPED: "message:stream:stopped",
  MESSAGE_ERROR: "message:error",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// ---------- Client -> Server payloads ----------

export interface MessageSendEvent {
  conversationId: string;
  content: string;
  attachmentIds?: string[];
  /** Client-generated id so the UI can reconcile optimistic messages. */
  clientMessageId: string;
}

export interface MessageStopEvent {
  conversationId: string;
}

// ---------- Server -> Client payloads ----------

export interface MessageAckEvent {
  clientMessageId: string;
  userMessage: ChatMessage;
}

export interface MessageStreamStartEvent {
  conversationId: string;
  messageId: string;
  model: string;
}

export interface MessageStreamChunkEvent {
  conversationId: string;
  messageId: string;
  delta: string;
}

export interface MessageStreamEndEvent {
  conversationId: string;
  message: ChatMessage;
}

export interface MessageStreamStoppedEvent {
  conversationId: string;
  messageId: string;
}

export interface MessageErrorEvent {
  conversationId: string;
  clientMessageId?: string;
  messageId?: string;
  code:
    | "UNAUTHENTICATED"
    | "CONVERSATION_NOT_FOUND"
    | "PROVIDER_UNAVAILABLE"
    | "RATE_LIMITED"
    | "VALIDATION_ERROR"
    | "INTERNAL_ERROR";
  message: string;
}
