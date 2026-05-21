import "server-only";
import { Resend } from "resend";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[Resend] RESEND_API_KEY is not set. Add it to .env.local and to Vercel environment variables."
    );
  }
  return new Resend(apiKey);
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "noreply@fytd.org";
}

export { getResendClient };
