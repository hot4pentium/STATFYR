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
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('[OneSignal] Missing APP_ID or REST_API_KEY');
    return { success: false, sentCount: 0, error: 'OneSignal not configured' };
  }

  if (playerIds.length === 0) {
    return { success: true, sentCount: 0 };
  }

  try {
    const topic = payload.topic || `notification-${Date.now()}`;
    const requestBody = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: payload.title },
      contents: { en: payload.message },
      url: payload.url,
      data: payload.data,
      web_push_topic: topic,
    };
    console.log('[OneSignal] Sending with topic:', topic);
    console.log('[OneSignal] Full request:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[OneSignal] API error:', result);
      return { success: false, sentCount: 0, error: result.errors?.[0] || 'Failed to send notification' };
    }

    console.log('[OneSignal] Notification sent to', playerIds.length, 'players:', result.id);
    return { success: true, sentCount: playerIds.length };
  } catch (error: any) {
    console.error('[OneSignal] Send error:', error);
    return { success: false, sentCount: 0, error: error.message };
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
