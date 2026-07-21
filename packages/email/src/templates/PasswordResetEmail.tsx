import { Button, Heading, Link, Section, Text } from '@react-email/components';
import BrandLayout from './BrandLayout';
import * as styles from './styles';

export interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export default function PasswordResetEmail({
  name,
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <BrandLayout preview="Reset your LearnHub password">
      <Heading style={styles.heading}>Reset your password</Heading>
      <Text style={styles.text}>
        Hi {name}, we received a request to reset the password for your LearnHub
        account. Click the button below to choose a new password.
      </Text>
      <Section style={styles.buttonSection}>
        <Button style={styles.button} href={resetUrl}>
          Reset password
        </Button>
      </Section>
      <Text style={styles.muted}>
        This link expires in 60 minutes. If you didn&apos;t request a password
        reset, you can safely ignore this email.
      </Text>
      <Text style={styles.muted}>
        <Link style={styles.link} href={resetUrl}>
          {resetUrl}
        </Link>
      </Text>
    </BrandLayout>
  );
}
