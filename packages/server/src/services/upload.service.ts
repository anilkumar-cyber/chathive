import { cloudinary } from "../config/cloudinary";
import { cloudinaryEnabled } from "../config/env";
import { ApiError } from "../utils/ApiError";

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  format: string;
  resourceType: string;
}

export async function uploadBuffer(buffer: Buffer, folder: string, resourceType: "image" | "video" | "raw" | "auto" = "auto"): Promise<UploadResult> {
  if (!cloudinaryEnabled) {
    throw ApiError.badRequest("File uploads are not configured on this server (missing Cloudinary credentials).");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `nexuschat/${folder}`, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          duration: result.duration,
          bytes: result.bytes,
          format: result.format,
          resourceType: result.resource_type,
        });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteAsset(publicId: string, resourceType: "image" | "video" | "raw" = "image"): Promise<void> {
  if (!cloudinaryEnabled) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
