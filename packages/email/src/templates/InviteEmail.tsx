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

export interface InviteEmailProps {
  orgName: string;
  inviteUrl: string;
  invitedByName: string;
}

export default function InviteEmail({
  orgName,
  inviteUrl,
  invitedByName,
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>
            You&apos;re invited to join {orgName}
          </Heading>
          <Text style={styles.text}>
            {invitedByName} has invited you to collaborate with{' '}
            <strong>{orgName}</strong> on LearnHub. Accept the invitation to get
            access to their shared courses and learning paths.
          </Text>
          <Section style={styles.buttonSection}>
            <Button style={styles.button} href={inviteUrl}>
              Accept invitation
            </Button>
          </Section>
          <Text style={styles.muted}>
            This invitation was intended for you. If you weren&apos;t expecting
            it, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
