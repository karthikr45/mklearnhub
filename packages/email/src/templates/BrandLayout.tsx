import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';
import * as styles from './styles';

export interface BrandLayoutProps {
  preview: string;
  children: ReactNode;
}

/**
 * Premium shared shell for every transactional email: branded indigo header,
 * rounded card body, and a "Powered by MK Tech Monk" footer. Templates only
 * provide their heading + body content.
 */
export default function BrandLayout({ preview, children }: BrandLayoutProps) {
  const year = new Date().getFullYear();
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <span style={styles.brandMark}>L</span>
            <span style={styles.brandName}>LearnHub</span>
          </Section>
          <Section style={styles.content}>{children}</Section>
          <Section style={styles.footer}>
            <Text style={styles.footerBrand}>Powered by MK Tech Monk</Text>
            <Text style={styles.footerText}>
              © {year} LearnHub. Learn, teach, and grow together.
              <br />
              You&apos;re receiving this because you have a LearnHub account.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
