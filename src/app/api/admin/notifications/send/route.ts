import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendFCMNotification, isFCMConfigured } from '@/lib/firebase-admin';

const VPS_API_BASE = 'http://201.18.192.154:3001/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      message,
      imageUrl = '',
      targetScreen = '',
      sendPush = true,
      sendInApp = true,
      topic = 'all_users',
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Title and message are required.' },
        { status: 400 }
      );
    }

    if (!sendPush && !sendInApp) {
      return NextResponse.json(
        { success: false, message: 'Please select at least one delivery option (Push or In-App).' },
        { status: 400 }
      );
    }

    let firestoreDocId: string | null = null;
    let vpsNotificationId: string | null = null;
    let fcmResult: any = null;
    let fcmError: string | null = null;

    // 1. Write to Firestore 'notifications' collection (for Flutter app and real-time listeners)
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        title,
        message,
        imageUrl: imageUrl || '',
        targetScreen: targetScreen || '',
        route: targetScreen || '',
        icon: 'notifications_none_rounded',
        iconColor: 0xFF176CAB,
        backgroundColor: 0xFFEAF6FF,
        sendPush: !!sendPush,
        sendInApp: !!sendInApp,
        topic,
        createdAt: serverTimestamp(),
        time: serverTimestamp(),
        status: sendPush ? 'pending' : 'in-app-only',
      });
      firestoreDocId = docRef.id;
    } catch (fsErr: any) {
      console.error('[Notifications API] Firestore write warning:', fsErr?.message || fsErr);
    }

    // 2. Persist to VPS PostgreSQL backend
    try {
      const authHeader = req.headers.get('authorization') || '';
      const vpsRes = await fetch(`${VPS_API_BASE}/admin/data/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          title,
          message,
          type: 'general',
          targetScreen: targetScreen || null,
          imageUrl: imageUrl || null,
        }),
      });
      const vpsData = await vpsRes.json();
      if (vpsData.success && vpsData.data?.id) {
        vpsNotificationId = vpsData.data.id;
      }
    } catch (vpsErr: any) {
      console.warn('[Notifications API] VPS write warning:', vpsErr?.message || vpsErr);
    }

    // 3. Dispatch FCM Push Notification (if requested)
    let fcmConfigured = isFCMConfigured();
    if (sendPush) {
      if (fcmConfigured) {
        try {
          fcmResult = await sendFCMNotification({
            topic,
            title,
            body: message,
            imageUrl: imageUrl || undefined,
            targetScreen: targetScreen || undefined,
            notificationId: firestoreDocId || vpsNotificationId || undefined,
          });
        } catch (pushErr: any) {
          console.error('[Notifications API] FCM send error:', pushErr);
          fcmError = pushErr.message || 'Failed to dispatch FCM message';
        }
      } else {
        fcmError = 'FCM_NOT_CONFIGURED';
      }
    }

    const effectiveId = firestoreDocId || vpsNotificationId;

    return NextResponse.json({
      success: true,
      message: fcmResult
        ? 'Notification published and push sent via FCM successfully!'
        : sendPush && !fcmConfigured
        ? 'In-app notification saved! Add FIREBASE_SERVICE_ACCOUNT_KEY in .env to enable instant system tray FCM push.'
        : 'Notification published successfully!',
      data: {
        id: effectiveId,
        firestoreDocId,
        vpsNotificationId,
        sendPush,
        sendInApp,
        fcmConfigured,
        fcmResult,
        fcmError: fcmError === 'FCM_NOT_CONFIGURED' ? undefined : fcmError,
        requiresServiceAccount: sendPush && !fcmConfigured,
      },
    });
  } catch (error: any) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const fcmConfigured = isFCMConfigured();
  return NextResponse.json({
    status: 'ok',
    fcmConfigured,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'narmadanchalsmartclassess',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '50585105381',
  });
}
