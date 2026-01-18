import { Resend } from 'resend';
import * as fs from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPricingPDF() {
  const pdfBuffer = fs.readFileSync('STATFYR_Pricing_Tiers.pdf');
  const pdfBase64 = pdfBuffer.toString('base64');

  const { data, error } = await resend.emails.send({
    from: 'STATFYR <onboarding@resend.dev>',
    to: ['hot4pentium@gmail.com'],
    subject: 'STATFYR Subscription Pricing Tiers',
    html: `
      <h1>STATFYR Subscription Pricing Tiers</h1>
      <p>Attached is the PDF document with your finalized pricing tiers:</p>
      <ul>
        <li><strong>Athlete Pro:</strong> $2.99/month</li>
        <li><strong>Supporter Pro:</strong> $5.99/month</li>
        <li><strong>Coach Pro:</strong> $7.99/month</li>
      </ul>
      <p>The PDF includes detailed breakdowns of free vs. pro features for each role, plus revenue calculations after App Store fees.</p>
      <p>Best,<br>STATFYR Team</p>
    `,
    attachments: [
      {
        filename: 'STATFYR_Pricing_Tiers.pdf',
        content: pdfBase64,
      },
    ],
  });

  if (error) {
    console.error('Failed to send email:', error);
    process.exit(1);
  }

  console.log('Email sent successfully!', data);
}

sendPricingPDF();
