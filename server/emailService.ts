import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.REPLIT_APP_URL || 'https://statfyr.replit.app';
const FROM_EMAIL = 'STATFYR <noreply@statfyr.com>';

interface EmailResult {
  success: boolean;
  error?: string;
}

function getBaseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #111;">
      <div style="max-width: 500px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-family: 'Oswald', sans-serif; font-size: 28px; font-weight: 700; color: #f97316; margin: 0; letter-spacing: 1px;">STATFYR</h1>
          <p style="color: #666; font-size: 12px; margin: 4px 0 0;">Sports Stats & Team Management</p>
        </div>
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; border: 1px solid #333;">
          ${content}
        </div>
        <p style="text-align: center; margin: 20px 0 0; color: #666; font-size: 11px;">
          You're receiving this because you opted in to notifications from STATFYR.<br>
          We never share or sell your email address.
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function sendNewFollowerEmail(
  athleteEmail: string,
  athleteName: string,
  followerName: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const content = `
      <h2 style="margin: 0 0 16px; color: #fff; font-size: 20px;">New Follower!</h2>
      <p style="margin: 0 0 16px; color: #ccc; font-size: 16px; line-height: 1.5;">
        <strong style="color: #f97316;">${followerName}</strong> just started following your HYPE Card!
      </p>
      <p style="margin: 0 0 20px; color: #999; font-size: 14px;">
        They'll receive email updates whenever you post new content.
      </p>
      <div style="background: #222; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #f97316; font-weight: 600;">Open the STATFYR app to see your followers</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: athleteEmail,
      subject: `${followerName} is now following you!`,
      html: getBaseTemplate(content),
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] New follower notification sent to:', athleteEmail);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendHypePostEmail(
  followerEmail: string,
  followerName: string,
  athleteName: string,
  athleteId: string,
  postId: string,
  message: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const truncatedMessage = message.length > 150 ? message.substring(0, 150) + '...' : message;

    const content = `
      <h2 style="margin: 0 0 16px; color: #fff; font-size: 20px;">New HYPE Post from ${athleteName}!</h2>
      <p style="margin: 0 0 16px; color: #ccc; font-size: 16px; line-height: 1.5; font-style: italic;">
        "${truncatedMessage}"
      </p>
      <div style="background: #222; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #f97316; font-weight: 600;">Open the STATFYR app to view this post</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: followerEmail,
      subject: `${athleteName} just posted on their HYPE Card!`,
      html: getBaseTemplate(content),
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] HYPE post notification sent to:', followerEmail);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendDirectMessageEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  teamId: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const truncatedPreview = messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview;

    const content = `
      <h2 style="margin: 0 0 16px; color: #fff; font-size: 20px;">New Message from ${senderName}</h2>
      <p style="margin: 0 0 16px; color: #ccc; font-size: 16px; line-height: 1.5;">
        "${truncatedPreview}"
      </p>
      <div style="background: #222; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #f97316; font-weight: 600;">Open the STATFYR app and go to Messages to reply</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `New message from ${senderName}`,
      html: getBaseTemplate(content),
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] DM notification sent to:', recipientEmail);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendEventReminderEmail(
  recipientEmail: string,
  recipientName: string,
  eventTitle: string,
  eventDate: Date,
  eventLocation: string | null,
  teamName: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(eventDate);

    const content = `
      <h2 style="margin: 0 0 16px; color: #fff; font-size: 20px;">Upcoming Event Reminder</h2>
      <div style="background: #222; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px; color: #f97316; font-size: 18px; font-weight: 600;">${eventTitle}</p>
        <p style="margin: 0 0 4px; color: #ccc; font-size: 14px;">${formattedDate}</p>
        ${eventLocation ? `<p style="margin: 0; color: #999; font-size: 14px;">${eventLocation}</p>` : ''}
        <p style="margin: 8px 0 0; color: #666; font-size: 12px;">${teamName}</p>
      </div>
      <div style="background: #222; border-radius: 8px; padding: 16px; text-align: center; margin-top: 16px;">
        <p style="margin: 0; color: #f97316; font-weight: 600;">Open the STATFYR app to view your Schedule</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Reminder: ${eventTitle} - ${teamName}`,
      html: getBaseTemplate(content),
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Event reminder sent to:', recipientEmail);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendTeamChatEmail(
  recipientEmail: string,
  senderName: string,
  messagePreview: string,
  teamName: string,
  teamId: string,
  channel: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const truncatedPreview = messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview;
    const channelDisplay = channel === 'announcements' ? 'Announcements' : 'General';

    const content = `
      <h2 style="margin: 0 0 16px; color: #fff; font-size: 20px;">New Message in ${teamName}</h2>
      <p style="margin: 0 0 8px; color: #999; font-size: 12px;">#${channelDisplay}</p>
      <p style="margin: 0 0 16px; color: #ccc; font-size: 16px; line-height: 1.5;">
        <strong style="color: #f97316;">${senderName}:</strong> "${truncatedPreview}"
      </p>
      <div style="background: #222; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #f97316; font-weight: 600;">Open the STATFYR app to view Team Chat</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `${senderName} in ${teamName}: ${truncatedPreview}`,
      html: getBaseTemplate(content),
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Team chat notification sent to:', recipientEmail);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendGameDayLiveEmail(
  recipientEmail: string,
  recipientName: string,
  teamName: string,
  opponent: string | null,
  eventDate: string,
  eventId: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const gameTitle = opponent ? `vs ${opponent}` : 'Game Day';
    const content = `
      <h2 style="margin: 0 0 16px; color: #fff; font-size: 20px;">Game Day Live is NOW ACTIVE!</h2>
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: center;">
        <p style="margin: 0; color: #fff; font-size: 24px; font-weight: 700;">${gameTitle}</p>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${teamName}</p>
      </div>
      <p style="margin: 0 0 16px; color: #ccc; font-size: 16px; line-height: 1.5;">
        The game is starting! Join now to cheer on your team with taps and shoutouts.
      </p>
      <div style="background: #222; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #f97316; font-weight: 600;">Open the STATFYR app to join Game Day Live!</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `LIVE NOW: ${teamName} ${gameTitle}`,
      html: getBaseTemplate(content),
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Game Day Live notification sent to:', recipientEmail);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error:', error);
    return { success: false, error: error.message };
  }
}

export function isConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
