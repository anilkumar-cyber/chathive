import admin from "firebase-admin";
import { env, firebaseEnabled } from "./env";
import { logger } from "./logger";

if (firebaseEnabled && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function sendPushNotification(
  tokens: string[],
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<void> {
  if (!firebaseEnabled || tokens.length === 0) return;
  try {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });
  } catch (err) {
    logger.error(`FCM push failed: ${(err as Error).message}`);
  }
}
