import type { CSSProperties } from 'react';

// Premium palette — matches the app brand (indigo #4f46e5).
export const BRAND = '#4f46e5';
const INK = '#1e1b3a';
const BODY_INK = '#3f3f52';

export const main: CSSProperties = {
  backgroundColor: '#eef0f6',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: '32px 0',
  margin: 0,
};

export const container: CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  margin: '0 auto',
  maxWidth: '560px',
  overflow: 'hidden',
  boxShadow: '0 10px 40px rgba(30, 27, 58, 0.08)',
};

// Branded header bar.
export const header: CSSProperties = {
  backgroundColor: BRAND,
  padding: '22px 32px',
};

export const brandRow: CSSProperties = {
  display: 'inline-block',
};

export const brandMark: CSSProperties = {
  display: 'inline-block',
  width: '30px',
  height: '30px',
  lineHeight: '30px',
  borderRadius: '9px',
  backgroundColor: 'rgba(255,255,255,0.18)',
  color: '#ffffff',
  fontSize: '17px',
  fontWeight: 800,
  textAlign: 'center',
  verticalAlign: 'middle',
  marginRight: '10px',
};

export const brandName: CSSProperties = {
  display: 'inline-block',
  color: '#ffffff',
  fontSize: '19px',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  verticalAlign: 'middle',
  margin: 0,
};

export const content: CSSProperties = {
  padding: '32px',
};

export const heading: CSSProperties = {
  color: INK,
  fontSize: '23px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: '0 0 16px',
};

export const text: CSSProperties = {
  color: BODY_INK,
  fontSize: '15px',
  lineHeight: '25px',
  margin: '0 0 16px',
};

export const buttonSection: CSSProperties = {
  margin: '26px 0',
  textAlign: 'center',
};

export const button: CSSProperties = {
  backgroundColor: BRAND,
  borderRadius: '10px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '13px 30px',
  textDecoration: 'none',
  boxShadow: '0 6px 18px rgba(79, 70, 229, 0.35)',
};

export const link: CSSProperties = {
  color: BRAND,
  wordBreak: 'break-all',
};

export const muted: CSSProperties = {
  color: '#8a8a99',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '16px 0 0',
};

export const digestItem: CSSProperties = {
  borderTop: '1px solid #ececf1',
  padding: '14px 0',
};

// Footer.
export const footer: CSSProperties = {
  backgroundColor: '#fafafc',
  borderTop: '1px solid #ececf1',
  padding: '22px 32px',
  textAlign: 'center',
};

export const footerBrand: CSSProperties = {
  color: '#6b6b7b',
  fontSize: '12px',
  fontWeight: 600,
  margin: '0 0 4px',
};

export const footerText: CSSProperties = {
  color: '#a0a0ad',
  fontSize: '11px',
  lineHeight: '17px',
  margin: 0,
};

// Receipt-specific.
export const receiptBox: CSSProperties = {
  border: '1px solid #ececf1',
  borderRadius: '12px',
  padding: '4px 20px',
  margin: '8px 0 20px',
};

export const receiptRow: CSSProperties = {
  borderBottom: '1px solid #f1f1f5',
  padding: '12px 0',
};

export const receiptLabel: CSSProperties = {
  color: '#8a8a99',
  fontSize: '13px',
  margin: 0,
};

export const receiptValue: CSSProperties = {
  color: INK,
  fontSize: '15px',
  fontWeight: 600,
  margin: '2px 0 0',
};

export const totalValue: CSSProperties = {
  color: BRAND,
  fontSize: '20px',
  fontWeight: 800,
  margin: '2px 0 0',
};

export const badge: CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  color: '#15803d',
  fontSize: '12px',
  fontWeight: 700,
  padding: '4px 12px',
  borderRadius: '999px',
};
