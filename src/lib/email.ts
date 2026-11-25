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

export interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailParams): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error(
      '[email] RESEND_API_KEY is not set; password reset links cannot be delivered'
    );
    return false;
  }

  try {
    const { error } = await getResend().emails.send({
      from: process.env.RESEND_FROM || 'Bakyson <onboarding@resend.dev>',
      to,
      subject: 'Reset your Bakyson password',
      html: `
        <h2>Reset your password</h2>
        <p>We received a request to reset the password for your Bakyson admin account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#ea580c;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
            Reset password
          </a>
        </p>
        <p>This link expires in ${expiresInMinutes} minutes and can only be used once.</p>
        <p>If the button does not work, copy and paste this address into your browser:</p>
        <p style="word-break:break-all;color:#555;">${resetUrl}</p>
        <p>If you didn't request this, you can safely ignore this email. Your password will not change.</p>
        <hr />
        <p style="color:#666;font-size:12px;">Bakyson ICT Solutions</p>
      `,
      text: `Reset your Bakyson password\n\nOpen this link to choose a new password:\n${resetUrl}\n\nThis link expires in ${expiresInMinutes} minutes and can only be used once.\n\nIf you didn't request this, you can safely ignore this email.`,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to send password reset email:', err);
    return false;
  }
}
