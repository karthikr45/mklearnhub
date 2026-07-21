import { Heading, Link, Section, Text } from '@react-email/components';
import BrandLayout from './BrandLayout';
import * as styles from './styles';

export interface DailyDigestItem {
  title: string;
  url: string;
}

export interface DailyDigestEmailProps {
  name: string;
  items: DailyDigestItem[];
}

export default function DailyDigestEmail({
  name,
  items,
}: DailyDigestEmailProps) {
  return (
    <BrandLayout preview="Your daily digest from LearnHub">
      <Heading style={styles.heading}>Your daily digest</Heading>
      <Text style={styles.text}>
        Hi {name}, here&apos;s what&apos;s new and worth your time today.
      </Text>
      <Section>
        {items.map((item, index) => (
          <div key={index} style={styles.digestItem}>
            <Link style={styles.link} href={item.url}>
              {item.title}
            </Link>
          </div>
        ))}
      </Section>
      <Text style={styles.muted}>
        You&apos;re receiving this because you subscribed to daily updates from
        LearnHub.
      </Text>
    </BrandLayout>
  );
}
