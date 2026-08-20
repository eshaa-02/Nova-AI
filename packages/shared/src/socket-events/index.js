"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = void 0;
/**
 * Canonical Socket.IO event names shared by apps/web and apps/api.
 * Import these constants instead of typing raw strings so a typo
 * becomes a compile error instead of a silent dropped listener.
 */
exports.SOCKET_EVENTS = {
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
};
//# sourceMappingURL=index.js.map