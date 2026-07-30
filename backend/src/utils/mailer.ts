import nodemailer from "nodemailer";

export interface SendMailParams {
  fromEmail?: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

/**
 * Send email using NodeMailer transport
 */
export async function sendEmailWithNodemailer(params: SendMailParams) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  console.log(`[Mailer] Preparing email dispatch to "${params.to}"...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const authenticatedUser = user || process.env.SMTP_USER;
  const fromAddress = authenticatedUser || params.fromEmail || "assistant@formpilot.ai";
  const fromName = params.fromName || "FormPilot Copilot";

  const mailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to: params.to,
    replyTo: params.fromEmail && params.fromEmail !== fromAddress ? params.fromEmail : undefined,
    subject: params.subject,
    text: params.body,
  };

  if (!user || !pass) {
    console.warn("[Mailer] SMTP credentials (SMTP_USER/SMTP_PASS) not configured in .env. Simulating email send for demonstration.");
    return {
      accepted: [params.to],
      messageId: `simulated-${Date.now()}@formpilot.local`,
      simulated: true,
    };
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] Email sent successfully to ${params.to}. MessageId: ${info.messageId}`);
  return info;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
