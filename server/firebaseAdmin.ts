import admin from 'firebase-admin';

let firebaseAdmin: admin.app.App | null = null;
let initAttempted = false;

let initError: string | null = null;

export function getFirebaseAdmin(): admin.app.App | null {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }
  
  if (initAttempted) {
    return null;
  }
  
  initAttempted = true;
  initError = null;

  let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountJson) {
    const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;
    if (base64Key) {
      console.log('[Firebase Admin] Found B64 key, decoding...');
      try {
        serviceAccountJson = Buffer.from(base64Key, 'base64').toString('utf8');
        console.log('[Firebase Admin] B64 decoded successfully');
      } catch (e) {
        initError = 'Failed to decode base64 key';
        console.warn('[Firebase Admin] Failed to decode FIREBASE_SERVICE_ACCOUNT_KEY_B64');
      }
    }
  } else {
    console.log('[Firebase Admin] Found direct JSON key');
  }
  
  if (!serviceAccountJson) {
    initError = 'No service account key configured';
    console.warn('[Firebase Admin] Service account not configured - push notifications disabled');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log('[Firebase Admin] JSON parsed, project_id:', serviceAccount.project_id);
    
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      initError = 'Missing required fields in service account';
      console.warn('[Firebase Admin] Service account missing required fields');
      return null;
    }
    
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('[Firebase Admin] Initialized successfully!');
    return firebaseAdmin;
  } catch (error: any) {
    initError = error.message || 'Unknown initialization error';
    console.error('[Firebase Admin] Failed to initialize:', error);
    return null;
  }
}

export function getFirebaseAdminStatus(): { initialized: boolean; error: string | null } {
  return {
    initialized: firebaseAdmin !== null,
    error: initError
  };
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
