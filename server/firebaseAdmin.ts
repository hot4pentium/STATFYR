import * as admin from 'firebase-admin';

let firebaseAdmin: admin.app.App | null = null;
let initAttempted = false;

export function getFirebaseAdmin(): admin.app.App | null {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }
  
  if (initAttempted) {
    return null;
  }
  
  initAttempted = true;

  let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountJson) {
    const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;
    if (base64Key) {
      try {
        serviceAccountJson = Buffer.from(base64Key, 'base64').toString('utf8');
      } catch (e) {
        console.warn('Failed to decode FIREBASE_SERVICE_ACCOUNT_KEY_B64');
      }
    }
  }
  
  if (!serviceAccountJson) {
    console.warn('Firebase service account not configured - push notifications disabled');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.warn('Firebase service account missing required fields');
      return null;
    }
    
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    return firebaseAdmin;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
  link?: string
): Promise<{ success: boolean; successCount: number; failureCount: number; invalidTokens: string[] }> {
  const app = getFirebaseAdmin();
  
  if (!app) {
    return { success: false, successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }

  if (tokens.length === 0) {
    return { success: true, successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const messaging = admin.messaging(app);
  
  const message: admin.messaging.MulticastMessage = {
    notification: {
      title,
      body,
    },
    data: data || {},
    webpush: link ? {
      fcmOptions: {
        link,
      },
    } : undefined,
    tokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { success: false, successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }
}
