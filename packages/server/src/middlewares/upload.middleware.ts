import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_FILE_SIZE_MB,
} from "@nexuschat/shared";
import multer from "multer";
import { ApiError } from "../utils/ApiError";

const allowedTypes = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
  ...ACCEPTED_AUDIO_TYPES,
  ...ACCEPTED_DOCUMENT_TYPES,
];

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`) as unknown as null, false);
    }
    cb(null, true);
  },
});
