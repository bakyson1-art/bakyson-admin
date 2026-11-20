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
      from: 'Bakyson <notifications@bakyson.com>',
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
