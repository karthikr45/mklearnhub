/**
 * Premium certificate PDF. Kept in its own module so `@react-pdf/renderer`
 * (a large dependency) is only pulled in when a user actually downloads a
 * certificate — the caller dynamically `import()`s this file on click.
 */
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer'

export interface CertificateData {
  recipientName: string
  courseTitle: string
  certificateNo: string
  issuedAt: string
  orgName?: string
}

const BRAND = '#4f46e5'
const INK = '#1e1b3a'
const MUTED = '#6b7280'
const GOLD = '#b7892f'

const styles = StyleSheet.create({
  page: {
    padding: 28,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  frame: {
    flexGrow: 1,
    borderWidth: 2,
    borderColor: BRAND,
    borderRadius: 6,
    padding: 4,
  },
  innerFrame: {
    flexGrow: 1,
    borderWidth: 0.75,
    borderColor: GOLD,
    borderRadius: 4,
    paddingVertical: 44,
    paddingHorizontal: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: { alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  brandMark: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: BRAND,
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingTop: 5,
    marginRight: 8,
  },
  brandName: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: INK },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    color: GOLD,
    fontFamily: 'Helvetica-Bold',
    marginTop: 18,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Times-Bold',
    color: INK,
    marginTop: 6,
    textAlign: 'center',
  },
  presented: { fontSize: 11, color: MUTED, marginTop: 24 },
  name: {
    fontSize: 34,
    fontFamily: 'Times-BoldItalic',
    color: BRAND,
    marginTop: 8,
    textAlign: 'center',
  },
  rule: {
    width: 260,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 10,
    marginBottom: 18,
  },
  body: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: 440,
  },
  course: { fontFamily: 'Helvetica-Bold', color: INK },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 30,
  },
  footCol: { alignItems: 'center', width: 180 },
  footValue: { fontSize: 10, color: INK, fontFamily: 'Helvetica-Bold' },
  footLine: {
    width: 150,
    borderBottomWidth: 0.75,
    borderBottomColor: '#9ca3af',
    marginBottom: 4,
  },
  footLabel: { fontSize: 8, color: MUTED, letterSpacing: 1, marginTop: 3 },
  poweredBy: {
    fontSize: 8,
    color: MUTED,
    textAlign: 'center',
    marginTop: 22,
    letterSpacing: 0.5,
  },
})

function CertificateDocument({ data }: { data: CertificateData }) {
  const issued = new Date(data.issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <Document
      title={`Certificate — ${data.courseTitle}`}
      author={data.orgName ?? 'LearnHub'}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.innerFrame}>
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <Text style={styles.brandMark}>L</Text>
                <Text style={styles.brandName}>
                  {data.orgName ?? 'LearnHub'}
                </Text>
              </View>
              <Text style={styles.eyebrow}>CERTIFICATE OF COMPLETION</Text>
              <Text style={styles.title}>Certificate of Achievement</Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.presented}>This is proudly presented to</Text>
              <Text style={styles.name}>{data.recipientName}</Text>
              <View style={styles.rule} />
              <Text style={styles.body}>
                for successfully completing the course{' '}
                <Text style={styles.course}>{data.courseTitle}</Text>, having
                demonstrated dedication and mastery of the material.
              </Text>
            </View>

            <View style={{ width: '100%' }}>
              <View style={styles.footer}>
                <View style={styles.footCol}>
                  <Text style={styles.footValue}>{issued}</Text>
                  <View style={styles.footLine} />
                  <Text style={styles.footLabel}>DATE ISSUED</Text>
                </View>
                <View style={styles.footCol}>
                  <Text style={styles.footValue}>{data.certificateNo}</Text>
                  <View style={styles.footLine} />
                  <Text style={styles.footLabel}>CERTIFICATE NO.</Text>
                </View>
              </View>
              <Text style={styles.poweredBy}>
                Powered by MK Tech Monk · Verify at learnhub.app/verify
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

/** Build the certificate PDF and return it as a Blob for download. */
export async function generateCertificateBlob(
  data: CertificateData,
): Promise<Blob> {
  return pdf(<CertificateDocument data={data} />).toBlob()
}
