import { Button, Heading, Section, Text } from '@react-email/components';
import BrandLayout from './BrandLayout';
import * as styles from './styles';

export interface WelcomeEmailProps {
  name: string;
  appUrl: string;
}

export default function WelcomeEmail({ name, appUrl }: WelcomeEmailProps) {
  return (
    <BrandLayout preview={`Welcome to LearnHub, ${name}!`}>
      <Heading style={styles.heading}>Welcome to LearnHub, {name}!</Heading>
      <Text style={styles.text}>
        We&apos;re thrilled to have you on board. LearnHub gives you access to
        thousands of courses, hands-on projects, and a community of learners
        ready to help you grow.
      </Text>
      <Section style={styles.buttonSection}>
        <Button style={styles.button} href={appUrl}>
          Explore courses
        </Button>
      </Section>
      <Text style={styles.text}>
        Happy learning,
        <br />
        The LearnHub Team
      </Text>
    </BrandLayout>
  );
}
