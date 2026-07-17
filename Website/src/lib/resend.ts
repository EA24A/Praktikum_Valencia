import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";
import { getEmailConfig, isEmailConfigured } from "./emailConfig";

export { isEmailConfigured };

type SendEmailOptions = Omit<CreateEmailOptions, "from"> & {
  from?: string;
};

export async function sendEmail(options: SendEmailOptions) {
  const config = await getEmailConfig();
  if (!config?.apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const resend = new Resend(config.apiKey);
  const payload = {
    from: options.from ?? config.fromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    cc: options.cc,
    bcc: options.bcc,
    headers: options.headers,
    attachments: options.attachments,
    tags: options.tags,
  };

  const { data, error } = await resend.emails.send(payload as CreateEmailOptions);

  if (error) {
    console.error("[resend]", error);
    throw new Error(error.message);
  }

  return data;
}

export async function getAdminEmail() {
  return (await getEmailConfig())?.adminEmail ?? "admin@casafenicia.com";
}

export async function getReservationAdminEmail() {
  return (await getEmailConfig())?.reservationAdminEmail ?? "ali@casafenicia.com";
}
