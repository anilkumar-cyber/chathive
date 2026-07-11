export enum UserRole {
  USER = "user",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

export enum UserStatus {
  ONLINE = "online",
  AWAY = "away",
  BUSY = "busy",
  INVISIBLE = "invisible",
  OFFLINE = "offline",
}

export enum ProfilePrivacy {
  PUBLIC = "public",
  FRIENDS_ONLY = "friends_only",
  PRIVATE = "private",
}

export enum ConversationType {
  PRIVATE = "private",
  GROUP = "group",
  ROOM = "room",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  VOICE = "voice",
  DOCUMENT = "document",
  GIF = "gif",
  STICKER = "sticker",
  SYSTEM = "system",
  LOCATION = "location",
  POLL = "poll",
}

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
}

export enum FriendRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export enum GroupRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

export enum NotificationType {
  FRIEND_REQUEST = "friend_request",
  FRIEND_ACCEPT = "friend_accept",
  MESSAGE = "message",
  MENTION = "mention",
  GROUP_INVITE = "group_invite",
  REACTION = "reaction",
  SYSTEM = "system",
}

export enum RoomCategory {
  GENERAL = "general",
  SPORTS = "sports",
  TECHNOLOGY = "technology",
  GAMING = "gaming",
  MUSIC = "music",
  MOVIES = "movies",
  DATING = "dating",
  EDUCATION = "education",
  BUSINESS = "business",
  PROGRAMMING = "programming",
  AI = "ai",
  TRAVEL = "travel",
  CUSTOM = "custom",
}

export enum ReportStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  DISMISSED = "dismissed",
  ACTIONED = "actioned",
}
