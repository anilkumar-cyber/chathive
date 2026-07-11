import { NotificationType, SocketEvents } from "@nexuschat/shared";
import { Notification, User } from "../models";
import { emitToUser } from "../sockets/io";
import { sendPushNotification } from "../config/firebase";

export async function createNotification(params: {
  recipient: string;
  sender?: string;
  type: NotificationType;
  content: string;
  link?: string;
}): Promise<void> {
  if (params.sender === params.recipient) return;

  const notification = await Notification.create(params);
  const populated = await notification.populate("sender", "username avatar");

  emitToUser(params.recipient, SocketEvents.NOTIFICATION_NEW, populated);

  const recipientUser = await User.findById(params.recipient).select("fcmTokens");
  if (recipientUser?.fcmTokens?.length) {
    await sendPushNotification(recipientUser.fcmTokens, {
      title: "NexusChat",
      body: params.content,
      data: { type: params.type, link: params.link ?? "" },
    });
  }
}
