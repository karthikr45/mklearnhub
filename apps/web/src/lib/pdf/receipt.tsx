/**
 * Premium payment receipt PDF. Isolated so `@react-pdf/renderer` is only
 * loaded when a receipt is generated (dynamically imported by the caller).
 */
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer'

export interface ReceiptData {
  receiptNo: string
  paymentId: string
  planName: string
  amountInr: number
  paidAt: string
  billedTo: string
  billedEmail?: string
  periodEnd?: string
}

const BRAND = '#4f46e5'
const INK = '#1e1b3a'
const MUTED = '#6b7280'
const LINE = '#e5e7eb'

const styles = StyleSheet.create({
  page: {
    padding: 44,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: INK,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: BRAND,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingTop: 5,
    marginRight: 8,
  },
  brandName: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  brandSub: { fontSize: 8, color: MUTED, marginTop: 1 },
  receiptTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: INK,
    textAlign: 'right',
  },
  receiptMeta: { fontSize: 9, color: MUTED, textAlign: 'right', marginTop: 4 },
  paidBadge: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  section: { marginBottom: 24 },
  label: {
    fontSize: 8,
    color: MUTED,
    letterSpacing: 1,
    marginBottom: 3,
    fontFamily: 'Helvetica-Bold',
  },
  value: { fontSize: 11 },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: INK,
    paddingBottom: 6,
    marginBottom: 6,
  },
  th: { fontSize: 8, color: MUTED, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  colDesc: { flex: 3 },
  colAmt: { flex: 1, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  totalBox: { width: 200 },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 10, color: MUTED },
  grandLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  grandValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: BRAND },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 44,
    right: 44,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 10,
    fontSize: 8,
    color: MUTED,
    textAlign: 'center',
  },
})

function money(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const paid = new Date(data.paidAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <Document title={`Receipt ${data.receiptNo}`} author="LearnHub">
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandMark}>L</Text>
              <View>
                <Text style={styles.brandName}>LearnHub</Text>
                <Text style={styles.brandSub}>Powered by MK Tech Monk</Text>
              </View>
            </View>
          </View>
          <View>
            <Text style={styles.receiptTitle}>RECEIPT</Text>
            <Text style={styles.receiptMeta}>No. {data.receiptNo}</Text>
            <Text style={styles.receiptMeta}>Date: {paid}</Text>
            <Text style={styles.paidBadge}>PAID</Text>
          </View>
        </View>

        <View style={[styles.section, { flexDirection: 'row', gap: 40 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>BILLED TO</Text>
            <Text style={styles.value}>{data.billedTo}</Text>
            {data.billedEmail ? (
              <Text style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>
                {data.billedEmail}
              </Text>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>PAYMENT REFERENCE</Text>
            <Text style={{ fontSize: 9 }}>{data.paymentId}</Text>
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.colDesc]}>DESCRIPTION</Text>
          <Text style={[styles.th, styles.colAmt]}>AMOUNT</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.colDesc}>
            <Text style={{ fontSize: 11 }}>{data.planName} plan — monthly</Text>
            {data.periodEnd ? (
              <Text style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>
                Renews {new Date(data.periodEnd).toLocaleDateString('en-IN')}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.colAmt, { fontSize: 11 }]}>
            {money(data.amountInr)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <View style={styles.totalBox}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={{ fontSize: 10 }}>{money(data.amountInr)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={{ fontSize: 10 }}>Included</Text>
            </View>
            <View
              style={[
                styles.totalLine,
                { borderTopWidth: 1, borderTopColor: INK, marginTop: 4, paddingTop: 6 },
              ]}
            >
              <Text style={styles.grandLabel}>Total paid</Text>
              <Text style={styles.grandValue}>{money(data.amountInr)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Thank you for your business. This is a computer-generated receipt and
          does not require a signature. · LearnHub · Powered by MK Tech Monk
        </Text>
      </Page>
    </Document>
  )
}

/** Build the receipt PDF and return it as a Blob for download. */
export async function generateReceiptBlob(data: ReceiptData): Promise<Blob> {
  return pdf(<ReceiptDocument data={data} />).toBlob()
}
