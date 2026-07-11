import { IConversation, IMessage, INotification, SocketEvents, UserStatus } from "@nexuschat/shared";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";

export function useSocketEvents(): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(accessToken);
    const { addMessage, updateMessage, removeMessage, upsertConversation, setUserOnline, setTyping } = useChatStore.getState();
    const { addNotification } = useNotificationStore.getState();

    const onNewMessage = (message: IMessage) => {
      const conversationId = typeof message.conversation === "string" ? message.conversation : (message.conversation as unknown as string);
      addMessage(conversationId, message);
      const sender = typeof message.sender === "object" ? message.sender : null;
      if (sender && sender._id !== currentUserId) {
        upsertConversation({ _id: conversationId, lastMessage: message, updatedAt: new Date().toISOString() } as IConversation);
      }
    };

    const onMessageEdited = (message: IMessage) => {
      const conversationId = typeof message.conversation === "string" ? message.conversation : (message.conversation as unknown as string);
      updateMessage(conversationId, message);
    };

    const onMessageDeleted = ({ messageId, forEveryone }: { messageId: string; forEveryone: boolean; conversationId?: string }) => {
      if (forEveryone) {
        Object.keys(useChatStore.getState().messagesByConversation).forEach((cid) => removeMessage(cid, messageId));
      }
    };

    const onMessageReacted = (message: IMessage) => {
      const conversationId = typeof message.conversation === "string" ? message.conversation : (message.conversation as unknown as string);
      updateMessage(conversationId, message);
    };

    const onTypingStart = ({ conversationId, userId }: { conversationId: string; userId: string }) => setTyping(conversationId, userId, true);
    const onTypingStop = ({ conversationId, userId }: { conversationId: string; userId: string }) => setTyping(conversationId, userId, false);

    const onUserOnline = ({ userId }: { userId: string }) => setUserOnline(userId, true);
    const onUserOffline = ({ userId }: { userId: string }) => setUserOnline(userId, false);

    const onNotification = (notification: INotification) => {
      addNotification(notification);
      toast(notification.content, { icon: "🔔" });
    };

    socket.on(SocketEvents.MESSAGE_NEW, onNewMessage);
    socket.on(SocketEvents.MESSAGE_EDITED, onMessageEdited);
    socket.on(SocketEvents.MESSAGE_DELETED, onMessageDeleted);
    socket.on(SocketEvents.MESSAGE_REACTED, onMessageReacted);
    socket.on(SocketEvents.TYPING_START, onTypingStart);
    socket.on(SocketEvents.TYPING_STOP, onTypingStop);
    socket.on(SocketEvents.USER_ONLINE, onUserOnline);
    socket.on(SocketEvents.USER_OFFLINE, onUserOffline);
    socket.on(SocketEvents.USER_STATUS_CHANGE, ({ userId, status }: { userId: string; status: UserStatus }) =>
      setUserOnline(userId, status !== UserStatus.OFFLINE)
    );
    socket.on(SocketEvents.NOTIFICATION_NEW, onNotification);
    socket.on(SocketEvents.CONNECT_ERROR, (err) => {
      // eslint-disable-next-line no-console
      console.warn("Socket connection error:", err.message);
    });

    return () => {
      const s = getSocket();
      s?.off(SocketEvents.MESSAGE_NEW, onNewMessage);
      s?.off(SocketEvents.MESSAGE_EDITED, onMessageEdited);
      s?.off(SocketEvents.MESSAGE_DELETED, onMessageDeleted);
      s?.off(SocketEvents.MESSAGE_REACTED, onMessageReacted);
      s?.off(SocketEvents.TYPING_START, onTypingStart);
      s?.off(SocketEvents.TYPING_STOP, onTypingStop);
      s?.off(SocketEvents.USER_ONLINE, onUserOnline);
      s?.off(SocketEvents.USER_OFFLINE, onUserOffline);
      s?.off(SocketEvents.NOTIFICATION_NEW, onNotification);
    };
  }, [accessToken, currentUserId]);
}
