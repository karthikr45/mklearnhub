import type { ReactElement, ReactNode } from 'react';

const DEFAULT_FROM = 'LearnHub <noreply@learnhub.com>';

export interface SendEmailOptions {
  to: string;
  subject: string;
  react?: ReactNode;
  html?: string;
  from?: string;
}

export type SendEmailResult = { id: string } | { skipped: true };

/**
 * Sends a transactional email through Resend.
 *
 * The Resend client is imported lazily and only constructed when an API key is
 * present, so importing this module never opens a connection. When
 * `RESEND_API_KEY` is missing the send is skipped (useful for local dev and
 * tests).
 */
export async function sendEmail(
  opts: SendEmailOptions,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[email] RESEND_API_KEY is not set — skipping send to %s',
      opts.to,
    );
    return { skipped: true };
  }

  let html = opts.html;
  if (opts.react !== undefined) {
    const { render } = await import('@react-email/render');
    html = await render(opts.react as ReactElement);
  }

  if (html === undefined) {
    throw new Error('sendEmail requires either `react` or `html` to be provided');
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: opts.from ?? DEFAULT_FROM,
    to: opts.to,
    subject: opts.subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
  if (!data) {
    throw new Error('Resend returned no data for the sent email');
  }

  return { id: data.id };
}
