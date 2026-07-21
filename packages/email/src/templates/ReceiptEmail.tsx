import { Column, Heading, Row, Section, Text } from '@react-email/components';
import BrandLayout from './BrandLayout';
import * as styles from './styles';

export interface ReceiptEmailProps {
  name: string;
  receiptNo: string;
  planName: string;
  amountLabel: string; // pre-formatted, e.g. "₹1,499"
  paidOn: string; // pre-formatted date
  paymentRef: string;
  periodEndLabel?: string;
}

export default function ReceiptEmail({
  name,
  receiptNo,
  planName,
  amountLabel,
  paidOn,
  paymentRef,
  periodEndLabel,
}: ReceiptEmailProps) {
  return (
    <BrandLayout preview={`Your LearnHub receipt ${receiptNo}`}>
      <Heading style={styles.heading}>Payment received</Heading>
      <Text style={styles.text}>
        Thanks {name} — we&apos;ve received your payment.{' '}
        <span style={styles.badge}>PAID</span>
      </Text>

      <Section style={styles.receiptBox}>
        <Row style={styles.receiptRow}>
          <Column>
            <Text style={styles.receiptLabel}>Plan</Text>
            <Text style={styles.receiptValue}>{planName}</Text>
          </Column>
          <Column align="right">
            <Text style={styles.receiptLabel}>Receipt no.</Text>
            <Text style={styles.receiptValue}>{receiptNo}</Text>
          </Column>
        </Row>
        <Row style={styles.receiptRow}>
          <Column>
            <Text style={styles.receiptLabel}>Paid on</Text>
            <Text style={styles.receiptValue}>{paidOn}</Text>
          </Column>
          <Column align="right">
            <Text style={styles.receiptLabel}>Reference</Text>
            <Text style={styles.receiptValue}>{paymentRef}</Text>
          </Column>
        </Row>
        <Row style={{ padding: '14px 0' }}>
          <Column>
            <Text style={styles.receiptLabel}>Total paid</Text>
          </Column>
          <Column align="right">
            <Text style={styles.totalValue}>{amountLabel}</Text>
          </Column>
        </Row>
      </Section>

      {periodEndLabel ? (
        <Text style={styles.muted}>
          Your subscription renews on {periodEndLabel}. You can manage or cancel
          it any time from Billing in your dashboard.
        </Text>
      ) : null}
      <Text style={styles.muted}>
        This is a computer-generated receipt and does not require a signature.
      </Text>
    </BrandLayout>
  );
}
