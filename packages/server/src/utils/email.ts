import nodemailer from "nodemailer";
import { emailEnabled, env } from "../config/env";
import { logger } from "../config/logger";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!emailEnabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    logger.info(`[email:dev-mode] to=${to} subject="${subject}"\n${html}`);
    return;
  }
  await t.sendMail({ from: env.EMAIL_FROM, to, subject, html });
}

export function verificationEmailTemplate(username: string, link: string): string {
  return `<div style="font-family:sans-serif;max-width:480px;margin:auto">
    <h2>Welcome to ChatiHive, ${username}!</h2>
    <p>Please verify your email address to activate your account.</p>
    <a href="${link}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:8px;text-decoration:none">Verify Email</a>
    <p style="color:#888;font-size:12px;margin-top:24px">If you didn't create this account, ignore this email. Link expires in 24 hours.</p>
  </div>`;
}

export function resetPasswordEmailTemplate(username: string, link: string): string {
  return `<div style="font-family:sans-serif;max-width:480px;margin:auto">
    <h2>Reset your password, ${username}</h2>
    <p>Click the button below to set a new password. This link expires in 1 hour.</p>
    <a href="${link}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:8px;text-decoration:none">Reset Password</a>
    <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, ignore this email. Your password won't change.</p>
  </div>`;
}
