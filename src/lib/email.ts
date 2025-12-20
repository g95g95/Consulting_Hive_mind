import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@consulting-hive.com";

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const client = getResend();
  if (!client) {
    console.log("[Email] Skipping email (no RESEND_API_KEY configured)");
    console.log("[Email] Would send to:", to);
    console.log("[Email] Subject:", subject);
    return { success: true, skipped: true };
  }

  try {
    const result = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    console.log("[Email] Sent successfully to:", to);
    return { success: true, data: result };
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return { success: false, error };
  }
}

export function getNewRequestEmailHtml({
  consultantName,
  clientName,
  requestTitle,
  requestSummary,
  requestUrl,
}: {
  consultantName: string;
  clientName: string;
  requestTitle: string;
  requestSummary: string;
  requestUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Consultation Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #f59e0b; margin: 0; font-size: 24px;">Consulting Hive Mind</h1>
  </div>

  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1e293b; margin-top: 0;">New Consultation Request</h2>

    <p>Hi ${consultantName},</p>

    <p><strong>${clientName}</strong> has sent you a consultation request:</p>

    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1e293b; margin-top: 0;">${requestTitle}</h3>
      <p style="color: #64748b; margin-bottom: 0;">${requestSummary}</p>
    </div>

    <a href="${requestUrl}" style="display: inline-block; background: #f59e0b; color: #1e293b; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">
      View Request
    </a>

    <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
      Log in to your dashboard to review and respond to this request.
    </p>
  </div>

  <div style="background: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #94a3b8; margin: 0; font-size: 12px;">
      Consulting Hive Mind - Shared Knowledge, Better Outcomes
    </p>
  </div>
</body>
</html>
`;
}
