import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPdfEmail() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx scripts/send-pdf-email.ts <email>');
    process.exit(1);
  }

  const pdfPath = path.join(process.cwd(), 'client/public/statfyr-features.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found at:', pdfPath);
    process.exit(1);
  }

  const pdfContent = fs.readFileSync(pdfPath);

  try {
    const { data, error } = await resend.emails.send({
      from: 'STATFYR <noreply@statfyr.com>',
      to: email,
      subject: 'STATFYR Features & Pricing Guide',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #111;">
          <div style="max-width: 500px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="font-family: 'Oswald', sans-serif; font-size: 28px; font-weight: 700; color: #f97316; margin: 0; letter-spacing: 1px;">STATFYR</h1>
              <p style="color: #666; font-size: 12px; margin: 4px 0 0;">Sports Stats & Team Management</p>
            </div>
            <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; border: 1px solid #333;">
              <h2 style="margin: 0 0 16px; color: #fff; font-size: 20px;">Your Features Guide</h2>
              <p style="margin: 0 0 16px; color: #ccc; font-size: 16px; line-height: 1.5;">
                Thank you for your interest in STATFYR! Attached you'll find our comprehensive features guide showing all dashboard cards and capabilities for each role.
              </p>
              <ul style="margin: 16px 0; padding-left: 20px; color: #ccc;">
                <li style="margin-bottom: 8px;"><strong style="color: #3b82f6;">Coach</strong> - Team management, StatTracker, PlayMaker</li>
                <li style="margin-bottom: 8px;"><strong style="color: #22c55e;">Athlete</strong> - Profile, HYPE Card, Highlights</li>
                <li style="margin-bottom: 8px;"><strong style="color: #a855f7;">Supporter</strong> - Game Day Live, Following, Themes</li>
              </ul>
              <p style="margin: 16px 0 0; color: #999; font-size: 14px;">
                Questions? Just reply to this email!
              </p>
            </div>
            <p style="text-align: center; margin: 20px 0 0; color: #666; font-size: 11px;">
              STATFYR - Empower Your Team. Elevate Every Athlete.
            </p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: 'STATFYR-Features-Guide.pdf',
          content: pdfContent.toString('base64'),
        }
      ]
    });

    if (error) {
      console.error('Failed to send email:', error);
      process.exit(1);
    }

    console.log('Email sent successfully to:', email);
    console.log('Email ID:', data?.id);
  } catch (err) {
    console.error('Error sending email:', err);
    process.exit(1);
  }
}

sendPdfEmail();
