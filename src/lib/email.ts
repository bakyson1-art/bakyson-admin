import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface TicketStatusEmailParams {
  to: string;
  subject: string;
  status: string;
  ticketId: number;
}

export async function sendTicketStatusEmail({
  to,
  subject,
  status,
  ticketId,
}: TicketStatusEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set; skipping ticket status email');
    return;
  }
  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM || 'Bakyson <onboarding@resend.dev>',
      to,
      subject: `Ticket #${ticketId} status updated — ${subject}`,
      html: `
        <h2>Support Ticket Update</h2>
        <p>Your ticket <strong>#${ticketId}</strong> — “${subject}” — has been updated.</p>
        <p><strong>New status:</strong> ${status.replace('_', ' ')}</p>
        <p>Log in to the client portal to view details and respond.</p>
        <hr />
        <p style="color:#666;font-size:12px;">Bakyson ICT Solutions</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send ticket status email:', err);
  }
}

export interface PasswordResetOTPParams {
  to: string;
  otp: string;
}

export async function sendPasswordResetOTP({ to, otp }: PasswordResetOTPParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set; skipping password reset OTP email');
    return;
  }
  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM || 'Bakyson <onboarding@resend.dev>',
      to,
      subject: 'Your password reset code',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset for your Bakyson admin account.</p>
        <p>Your one-time code is: <strong style="font-size:20px;letter-spacing:2px;">${otp}</strong></p>
        <p>This code expires in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr />
        <p style="color:#666;font-size:12px;">Bakyson ICT Solutions</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send password reset OTP email:', err);
  }
}
