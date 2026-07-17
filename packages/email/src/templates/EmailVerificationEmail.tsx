import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Section,
  Text,
} from '@react-email/components';
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
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Verify your email</Heading>
          <Text style={styles.text}>
            Hi {name}, thanks for signing up. Please confirm your email address
            to activate your LearnHub account.
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
            If you didn&apos;t create a LearnHub account, you can safely ignore
            this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
