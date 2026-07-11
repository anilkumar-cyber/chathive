import { Response } from "express";

export function sendSuccess<T>(res: Response, statusCode: number, data?: T, message?: string): Response {
  return res.status(statusCode).json({ success: true, message, data });
}

export function paginate(page?: string | number, limit?: string | number) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 30));
  return { page: p, limit: l, skip: (p - 1) * l };
}

export function buildPaginatedResponse<T>(items: T[], total: number, page: number, limit: number) {
  return { items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
}
