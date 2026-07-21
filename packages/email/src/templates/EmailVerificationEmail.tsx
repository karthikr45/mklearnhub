import { Button, Heading, Link, Section, Text } from '@react-email/components';
import BrandLayout from './BrandLayout';
import * as styles from './styles';

export interface EmailVerificationEmailProps {
  name: string;
  verifyUrl: string;
}

export default function EmailVerificationEmail({
  name,
  verifyUrl,
}: EmailVerificationEmailProps) {
  return (
    <BrandLayout preview="Verify your LearnHub email address">
      <Heading style={styles.heading}>Verify your email</Heading>
      <Text style={styles.text}>
        Hi {name}, thanks for signing up. Please confirm your email address to
        activate your LearnHub account.
      </Text>
      <Section style={styles.buttonSection}>
        <Button style={styles.button} href={verifyUrl}>
          Verify email
        </Button>
      </Section>
      <Text style={styles.muted}>
        If the button doesn&apos;t work, paste this link into your browser:
        <br />
        <Link style={styles.link} href={verifyUrl}>
          {verifyUrl}
        </Link>
      </Text>
      <Text style={styles.muted}>
        If you didn&apos;t create a LearnHub account, you can safely ignore this
        email.
      </Text>
    </BrandLayout>
  );
}
