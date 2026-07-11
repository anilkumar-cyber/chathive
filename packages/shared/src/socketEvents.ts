export const SocketEvents = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",

  // Presence
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  USER_STATUS_CHANGE: "user:status_change",
  PRESENCE_SYNC: "presence:sync",

  // Rooms / conversations
  JOIN_CONVERSATION: "conversation:join",
  LEAVE_CONVERSATION: "conversation:leave",
  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",

  // Messaging
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
  MESSAGE_EDIT: "message:edit",
  MESSAGE_EDITED: "message:edited",
  MESSAGE_DELETE: "message:delete",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_REACT: "message:react",
  MESSAGE_REACTED: "message:reacted",
  MESSAGE_PIN: "message:pin",
  MESSAGE_PINNED: "message:pinned",

  // Delivery / read
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_SEEN: "message:seen",

  // Typing
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // Calls (signaling only, phase 2)
  CALL_INVITE: "call:invite",
  CALL_ACCEPT: "call:accept",
  CALL_REJECT: "call:reject",
  CALL_END: "call:end",
  CALL_SIGNAL: "call:signal",

  // Notifications
  NOTIFICATION_NEW: "notification:new",

  // Friends
  FRIEND_REQUEST_NEW: "friend:request_new",
  FRIEND_REQUEST_ACCEPTED: "friend:request_accepted",

  // Errors
  ERROR: "error",
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
