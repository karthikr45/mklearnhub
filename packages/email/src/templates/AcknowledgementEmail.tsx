import { Button, Heading, Section, Text } from '@react-email/components';
import BrandLayout from './BrandLayout';
import * as styles from './styles';

export interface AcknowledgementEmailProps {
  name: string;
  subject: string;
  message: string;
  referenceId?: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

/**
 * Generic branded acknowledgement — e.g. "we received your request",
 * "your submission is recorded", parental-consent confirmations, etc.
 */
export default function AcknowledgementEmail({
  name,
  subject,
  message,
  referenceId,
  ctaUrl,
  ctaLabel,
}: AcknowledgementEmailProps) {
  return (
    <BrandLayout preview={subject}>
      <Heading style={styles.heading}>{subject}</Heading>
      <Text style={styles.text}>Hi {name},</Text>
      <Text style={styles.text}>{message}</Text>
      {referenceId ? (
        <Section style={styles.receiptBox}>
          <Text style={{ ...styles.receiptLabel, padding: '12px 0 0' }}>
            Reference
          </Text>
          <Text style={{ ...styles.receiptValue, padding: '0 0 12px' }}>
            {referenceId}
          </Text>
        </Section>
      ) : null}
      {ctaUrl && ctaLabel ? (
        <Section style={styles.buttonSection}>
          <Button style={styles.button} href={ctaUrl}>
            {ctaLabel}
          </Button>
        </Section>
      ) : null}
      <Text style={styles.muted}>
        If you have any questions, just reply to this email and our team will be
        happy to help.
      </Text>
    </BrandLayout>
  );
}
