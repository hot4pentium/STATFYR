const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

interface NotificationPayload {
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
  topic?: string;
}

export async function sendPushToPlayer(
  playerId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('[OneSignal] Missing APP_ID or REST_API_KEY');
    return { success: false, error: 'OneSignal not configured' };
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [playerId],
        headings: { en: payload.title },
        contents: { en: payload.message },
        url: payload.url,
        data: payload.data,
        web_push_topic: payload.topic || `notification-${Date.now()}`,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[OneSignal] API error:', result);
      return { success: false, error: result.errors?.[0] || 'Failed to send notification' };
    }

    console.log('[OneSignal] Notification sent:', result.id);
    return { success: true };
  } catch (error: any) {
    console.error('[OneSignal] Send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPushToPlayers(
  playerIds: string[],
  payload: NotificationPayload
): Promise<{ success: boolean; sentCount: number; failedCount: number; invalidPlayerIds: string[]; error?: string }> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('[OneSignal] Missing APP_ID or REST_API_KEY');
    return { success: false, sentCount: 0, failedCount: playerIds.length, invalidPlayerIds: [], error: 'OneSignal not configured' };
  }

  if (playerIds.length === 0) {
    return { success: true, sentCount: 0, failedCount: 0, invalidPlayerIds: [] };
  }

  try {
    // Use a unique ID for each notification to prevent iOS from collapsing them
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const requestBody = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: payload.title },
      contents: { en: payload.message },
      url: payload.url,
      data: { ...payload.data, _nid: uniqueId }, // Add unique ID to data
      // Don't use web_push_topic to avoid collapsing - each notification should be separate
      // web_push_topic: undefined,
      ttl: 86400, // Time to live: 24 hours
      priority: 10, // High priority for immediate delivery
      // Explicitly set no subtitle to avoid iOS duplication
      subtitle: undefined,
    };
    console.log('[OneSignal] Sending notification ID:', uniqueId);
    console.log('[OneSignal] Sending to player IDs:', playerIds);
    console.log('[OneSignal] Notification data:', JSON.stringify(payload.data));
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log('[OneSignal] HTTP status:', response.status);
    console.log('[OneSignal] API response:', JSON.stringify(result, null, 2));
    console.log('[OneSignal] Response keys:', Object.keys(result));
    
    const invalidIds: string[] = [];
    
    // Check for invalid player IDs in errors
    if (result.errors && result.errors.invalid_player_ids) {
      invalidIds.push(...result.errors.invalid_player_ids);
    }
    
    // OneSignal returns a notification ID if the request was accepted
    // The 'recipients' field may not be present immediately - it's populated asynchronously
    // If we have an ID and no errors, consider it a success
    const hasNotificationId = !!result.id;
    const hasErrors = result.errors && (Array.isArray(result.errors) ? result.errors.length > 0 : Object.keys(result.errors).length > 0);
    
    // Calculate recipients - if not provided but we have an ID, assume sent to all valid players
    let recipients = result.recipients;
    if (recipients === undefined && hasNotificationId && !hasErrors) {
      // Notification was accepted - assume all non-invalid players received it
      recipients = playerIds.length - invalidIds.length;
    }
    recipients = recipients || 0;
    
    const failedCount = invalidIds.length;
    const sentCount = Math.max(0, playerIds.length - invalidIds.length);
    
    console.log('[OneSignal] Result - hasId:', hasNotificationId, 'hasErrors:', hasErrors, 'sent:', sentCount, 'failed:', failedCount, 'invalid IDs:', invalidIds.length);
    
    // If we got a notification ID and no errors, consider it a success
    if (hasNotificationId && !hasErrors) {
      return { 
        success: true, 
        sentCount, 
        failedCount,
        invalidPlayerIds: invalidIds
      };
    }
    
    // Check if there are explicit errors
    if (hasErrors || !response.ok) {
      const errorMsg = result.errors?.[0] || (Array.isArray(result.errors) ? result.errors.join(', ') : 'Notification failed');
      console.error('[OneSignal] API error:', errorMsg);
      return { 
        success: false, 
        sentCount: 0, 
        failedCount: playerIds.length,
        invalidPlayerIds: invalidIds,
        error: errorMsg
      };
    }

    return { success: true, sentCount, failedCount, invalidPlayerIds: invalidIds };
  } catch (error: any) {
    console.error('[OneSignal] Send error:', error);
    return { success: false, sentCount: 0, failedCount: playerIds.length, invalidPlayerIds: [], error: error.message };
  }
}

export async function sendPushToSegment(
  segment: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('[OneSignal] Missing APP_ID or REST_API_KEY');
    return { success: false, error: 'OneSignal not configured' };
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: [segment],
        headings: { en: payload.title },
        contents: { en: payload.message },
        url: payload.url,
        data: payload.data,
        web_push_topic: payload.topic || `notification-${Date.now()}`,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[OneSignal] API error:', result);
      return { success: false, error: result.errors?.[0] || 'Failed to send notification' };
    }

    console.log('[OneSignal] Notification sent to segment:', segment, result.id);
    return { success: true };
  } catch (error: any) {
    console.error('[OneSignal] Send error:', error);
    return { success: false, error: error.message };
  }
}

export function isConfigured(): boolean {
  return !!(ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY);
}

interface EmailPayload {
  subject: string;
  body: string;
  fromName?: string;
  preheader?: string;
}

export async function sendEmailToAddress(
  email: string,
  payload: EmailPayload
): Promise<{ success: boolean; error?: string }> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('[OneSignal Email] Missing APP_ID or REST_API_KEY');
    return { success: false, error: 'OneSignal not configured' };
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_email_tokens: [email],
        email_subject: payload.subject,
        email_body: payload.body,
        email_from_name: payload.fromName || 'STATFYR',
        email_preheader: payload.preheader,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[OneSignal Email] API error:', result);
      return { success: false, error: result.errors?.[0] || 'Failed to send email' };
    }

    console.log('[OneSignal Email] Sent to:', email, 'ID:', result.id);
    return { success: true };
  } catch (error: any) {
    console.error('[OneSignal Email] Send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendChatNotificationEmail(
  recipientEmail: string,
  senderName: string,
  messagePreview: string,
  chatUrl: string
): Promise<{ success: boolean; error?: string }> {
  const truncatedPreview = messagePreview.length > 100 
    ? messagePreview.substring(0, 100) + '...' 
    : messagePreview;

  const emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px;">New Message from ${senderName}</h2>
        <p style="margin: 0 0 20px; color: #666; font-size: 16px; line-height: 1.5;">"${truncatedPreview}"</p>
        <a href="${chatUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Message</a>
        <p style="margin: 20px 0 0; color: #999; font-size: 12px;">STATFYR - Team Management Made Easy</p>
      </div>
    </body>
    </html>
  `;

  return sendEmailToAddress(recipientEmail, {
    subject: `New message from ${senderName}`,
    body: emailBody,
    preheader: truncatedPreview,
  });
}
