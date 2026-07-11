import { NextFunction, Request, Response } from "express";

// In-memory: fine for single instance. Multi-instance deploys should move this to Redis.
const blockedIps = new Set<string>();
const blockedDevices = new Set<string>();

export function blockIp(ip: string): void {
  blockedIps.add(ip);
}
export function unblockIp(ip: string): void {
  blockedIps.delete(ip);
}
export function blockDevice(deviceId: string): void {
  blockedDevices.add(deviceId);
}
export function getBlockedIps(): string[] {
  return Array.from(blockedIps);
}

export function ipBlockGuard(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? "";
  if (blockedIps.has(ip)) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }
  const deviceId = req.headers["x-device-id"] as string | undefined;
  if (deviceId && blockedDevices.has(deviceId)) {
    res.status(403).json({ success: false, message: "Device blocked" });
    return;
  }
  next();
}
