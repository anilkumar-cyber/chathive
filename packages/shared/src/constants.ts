export const ROOM_CATEGORIES = [
  "general",
  "sports",
  "technology",
  "gaming",
  "music",
  "movies",
  "dating",
  "education",
  "business",
  "programming",
  "ai",
  "travel",
  "custom",
] as const;

export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_GROUP_MEMBERS = 500;
export const MAX_FILE_SIZE_MB = 25;
export const TYPING_TIMEOUT_MS = 3000;
export const DEFAULT_PAGE_SIZE = 30;
export const STORY_EXPIRY_HOURS = 24;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];
export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
];
