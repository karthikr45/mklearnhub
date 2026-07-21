import { createElement } from 'react';

import ReceiptEmail, { type ReceiptEmailProps } from './templates/ReceiptEmail';
import AcknowledgementEmail, {
  type AcknowledgementEmailProps,
} from './templates/AcknowledgementEmail';

/**
 * Server-side HTML renderers for transactional emails. These keep all React /
 * @react-email usage inside this package, so consumers (the NestJS API) can
 * send emails by passing plain HTML without taking a direct React dependency.
 */
async function toHtml(node: Parameters<
  Awaited<typeof import('@react-email/render')>['render']
>[0]): Promise<string> {
  const { render } = await import('@react-email/render');
  return render(node);
}

export function renderReceiptEmail(props: ReceiptEmailProps): Promise<string> {
  return toHtml(createElement(ReceiptEmail, props));
}

export function renderAcknowledgementEmail(
  props: AcknowledgementEmailProps,
): Promise<string> {
  return toHtml(createElement(AcknowledgementEmail, props));
}
