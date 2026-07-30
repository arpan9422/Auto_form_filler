import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { sendEmailWithNodemailer } from "../../../../utils/mailer";

export const sendEmailSchema = z.object({
  to: z.string().email().describe("The recipient's email address (e.g., recruiter@company.com)"),
  subject: z.string().min(1).describe("The email subject line"),
  body: z.string().min(1).describe("The complete email body text"),
  confirmed: z
    .boolean()
    .optional()
    .default(false)
    .describe("Must be set to true ONLY when the user has explicitly confirmed sending the email after reviewing the draft"),
});

export interface SendEmailToolOptions {
  userEmail?: string;
  userName?: string;
}

/**
 * Execute email dispatch with mandatory human-in-the-loop confirmation check
 */
export async function executeSendEmailTool(
  params: z.infer<typeof sendEmailSchema>,
  options: SendEmailToolOptions
) {
  const userEmail = options.userEmail || "user@formpilot.local";
  const userName = options.userName || "FormPilot User";

  // Mandatory Confirmation Guard: Never send without explicit user confirmation
  if (!params.confirmed) {
    console.log(`[sendEmail.tool] Draft created for "${params.to}". Awaiting user confirmation...`);
    return {
      status: "REQUIRES_USER_CONFIRMATION",
      confirmationRequired: true,
      draft: {
        from: `${userName} <${userEmail}>`,
        to: params.to,
        subject: params.subject,
        body: params.body,
      },
      userInstruction: `[EMAIL_CONFIRMATION_REQUIRED]\nFROM: ${userEmail}\nTO: ${params.to}\nSUBJECT: ${params.subject}\nBODY:\n${params.body}\n\n⚠️ Confirmation Needed: Please review the email draft above and accept or decline.`,
    };
  }

  // User confirmed -> Dispatch email via NodeMailer
  console.log(`[sendEmail.tool] User confirmed email dispatch to "${params.to}". Executing NodeMailer...`);
  try {
    const result = await sendEmailWithNodemailer({
      fromEmail: userEmail,
      fromName: userName,
      to: params.to,
      subject: params.subject,
      body: params.body,
    });

    return {
      status: "SUCCESS",
      recipient: params.to,
      subject: params.subject,
      sender: userEmail,
      messageId: (result as any)?.messageId ?? "sent-ok",
      simulated: (result as any)?.simulated ?? false,
      userInstruction: `✅ Email successfully sent to **${params.to}** from **${userEmail}** via NodeMailer!`,
    };
  } catch (error: any) {
    console.error("[sendEmail.tool] Failed to dispatch email:", error);
    return {
      status: "ERROR",
      recipient: params.to,
      error: error?.message || "Failed to send email via NodeMailer SMTP.",
      userInstruction: `❌ Failed to send email to **${params.to}**: ${error?.message || "SMTP error"}. Please verify your SMTP settings in backend environment variables.`,
    };
  }
}
