import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Text,
} from '@react-email/components';
import * as styles from './styles';

export interface CertificateEmailProps {
  name: string;
  courseTitle: string;
  downloadUrl: string;
}

export default function CertificateEmail({
  name,
  courseTitle,
  downloadUrl,
}: CertificateEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Congratulations, {name}!</Heading>
          <Text style={styles.text}>
            You&apos;ve completed <strong>{courseTitle}</strong> and earned your
            certificate of completion. Download it below to share your
            achievement.
          </Text>
          <Section style={styles.buttonSection}>
            <Button style={styles.button} href={downloadUrl}>
              Download certificate
            </Button>
          </Section>
          <Text style={styles.text}>
            Keep up the momentum — there&apos;s always something new to learn on
            LearnHub.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
