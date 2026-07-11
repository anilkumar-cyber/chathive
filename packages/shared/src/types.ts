import {
  ConversationType,
  FriendRequestStatus,
  GroupRole,
  MessageStatus,
  MessageType,
  NotificationType,
  ProfilePrivacy,
  RoomCategory,
  UserRole,
  UserStatus,
} from "./enums";

export interface IUserPublic {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  age?: number;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  country?: string;
  state?: string;
  city?: string;
  languages?: string[];
  interests?: string[];
  profession?: string;
  role: UserRole;
  status: UserStatus;
  customStatus?: string;
  lastSeen: string;
  isVerified: boolean;
  profilePrivacy: ProfilePrivacy;
  isBanned: boolean;
  isSuspended: boolean;
  isGuest: boolean;
  guestExpiresAt?: string;
  createdAt: string;
}

export interface IMessageReaction {
  emoji: string;
  userId: string;
}

export interface IAttachment {
  url: string;
  type: MessageType;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface IMessage {
  _id: string;
  conversation: string;
  sender: IUserPublic | string;
  type: MessageType;
  content: string;
  attachments?: IAttachment[];
  replyTo?: string | IMessage;
  forwardedFrom?: string;
  mentions?: string[];
  reactions?: IMessageReaction[];
  status: MessageStatus;
  deliveredTo: string[];
  seenBy: string[];
  isEdited: boolean;
  isPinned: boolean;
  deletedFor: string[];
  isDeletedForEveryone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  _id: string;
  type: ConversationType;
  participants: IUserPublic[] | string[];
  name?: string;
  avatar?: string;
  description?: string;
  category?: RoomCategory;
  isPublic?: boolean;
  createdBy?: string;
  admins?: string[];
  lastMessage?: IMessage;
  lastMessageAt?: string;
  pinnedMessages?: string[];
  mutedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IGroupMember {
  user: string;
  role: GroupRole;
  joinedAt: string;
}

export interface IFriendRequest {
  _id: string;
  from: IUserPublic | string;
  to: IUserPublic | string;
  status: FriendRequestStatus;
  createdAt: string;
}

export interface INotification {
  _id: string;
  recipient: string;
  sender?: IUserPublic | string;
  type: NotificationType;
  content: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string> | string[];
}

export interface IPaginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}
