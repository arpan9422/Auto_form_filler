import { AppError } from "./AppError";

type BrevoRecipient = {
  email: string;
  name?: string;
};

type SendEmailPayload = {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendEmailWithBrevo = async (payload: SendEmailPayload) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "AI Form Assistant";

  if (!apiKey || !senderEmail) {
    throw new AppError("Brevo email service is not configured", 500);
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },
      to: payload.to,
      subject: payload.subject,
      htmlContent: payload.htmlContent,
      textContent: payload.textContent,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError("Failed to send email with Brevo", 502, body);
  }
};

export const sendOtpEmail = async (email: string, otp: string, purpose: "signup" | "login") => {
  const title = purpose === "signup" ? "Complete your signup" : "Complete your login";

  await sendEmailWithBrevo({
    to: [{ email }],
    subject: `${title} - Your OTP`,
    textContent: `Your OTP is ${otp}. It will expire in 10 minutes.`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">${title}</h2>
        <p>Your one-time password is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 18px 0; color: #f59e0b;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this email, you can safely ignore it.</p>
      </div>
    `,
  });
};
