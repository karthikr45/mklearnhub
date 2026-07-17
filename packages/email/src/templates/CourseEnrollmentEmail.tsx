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

export interface CourseEnrollmentEmailProps {
  name: string;
  courseTitle: string;
  courseUrl: string;
}

export default function CourseEnrollmentEmail({
  name,
  courseTitle,
  courseUrl,
}: CourseEnrollmentEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>You&apos;re enrolled!</Heading>
          <Text style={styles.text}>
            Hi {name}, you&apos;ve successfully enrolled in{' '}
            <strong>{courseTitle}</strong>. Your first lesson is ready whenever
            you are.
          </Text>
          <Section style={styles.buttonSection}>
            <Button style={styles.button} href={courseUrl}>
              Start learning
            </Button>
          </Section>
          <Text style={styles.text}>
            Set aside a little time each day and you&apos;ll be finished before
            you know it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
