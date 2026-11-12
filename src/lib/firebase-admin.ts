import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging, Notification, AndroidConfig, ApnsConfig } from 'firebase-admin/messaging';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function getFirebaseAdminApp(): App | null {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // 1. Check for raw JSON string in FIREBASE_SERVICE_ACCOUNT_KEY
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'narmadanchalsmartclassess',
      });
      return adminApp;
    } catch (e) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e);
    }
  }

  // 2. Check for individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'narmadanchalsmartclassess';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    // Handle escaped newlines in environment variable
    privateKey = privateKey.replace(/\\n/g, '\n');
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      return adminApp;
    } catch (e) {
      console.error('[Firebase Admin] Failed to initialize with clientEmail/privateKey:', e);
    }
  }

  return null;
}

export function isFCMConfigured(): boolean {
  return getFirebaseAdminApp() !== null;
}

export function getAdminMessaging(): Messaging | null {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getMessaging(app);
}

export function getAdminFirestore(): Firestore | null {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

export interface SendFCMOptions {
  topic?: string;
  token?: string;
  tokens?: string[];
  title: string;
  body: string;
  imageUrl?: string;
  targetScreen?: string;
  notificationId?: string;
}

export async function sendFCMNotification(options: SendFCMOptions) {
  const messaging = getAdminMessaging();
  if (!messaging) {
    throw new Error(
      'FCM is not initialized. Please configure FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY in your environment.'
    );
  }

  const { topic = 'all_users', token, tokens, title, body, imageUrl, targetScreen, notificationId } = options;

  const dataPayload: Record<string, string> = {
    click_action: 'FLUTTER_NOTIFICATION_CLICK',
    id: notificationId || '',
    title,
    message: body,
    targetScreen: targetScreen || '',
    route: targetScreen || '',
  };
  if (imageUrl) {
    dataPayload.imageUrl = imageUrl;
  }

  const notificationPayload: Notification = {
    title,
    body,
  };
  if (imageUrl) {
    notificationPayload.imageUrl = imageUrl;
  }

  const androidConfig: AndroidConfig = {
    priority: 'high',
    notification: {
      channelId: 'high_importance_channel',
      sound: 'default',
      priority: 'high',
      defaultSound: true,
      defaultVibrateTimings: true,
      ...(imageUrl ? { imageUrl } : {}),
    },
  };

  const apnsConfig: ApnsConfig = {
    headers: {
      'apns-priority': '10',
    },
    payload: {
      aps: {
        sound: 'default',
        contentAvailable: true,
      },
    },
    ...(imageUrl ? { fcmOptions: { imageUrl } } : {}),
  };

  // Case A: Multicast to specific device tokens
  if (tokens && tokens.length > 0) {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: notificationPayload,
      data: dataPayload,
      android: androidConfig,
      apns: apnsConfig,
    });
    return {
      type: 'multicast',
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  }

  // Case B: Single device token
  if (token) {
    const messageId = await messaging.send({
      token,
      notification: notificationPayload,
      data: dataPayload,
      android: androidConfig,
      apns: apnsConfig,
    });
    return { type: 'token', messageId };
  }

  // Case C: Broadcast to Topic (Default 'all_users')
  const messageId = await messaging.send({
    topic,
    notification: notificationPayload,
    data: dataPayload,
    android: androidConfig,
    apns: apnsConfig,
  });

  return { type: 'topic', topic, messageId };
}
