import type { CSSProperties } from 'react';

export const main: CSSProperties = {
  backgroundColor: '#f4f4f7',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: '24px 0',
};

export const container: CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '520px',
  padding: '32px',
};

export const heading: CSSProperties = {
  color: '#1a1a2e',
  fontSize: '22px',
  fontWeight: 700,
  margin: '0 0 16px',
};

export const text: CSSProperties = {
  color: '#3c3c47',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

export const buttonSection: CSSProperties = {
  margin: '24px 0',
  textAlign: 'center',
};

export const button: CSSProperties = {
  backgroundColor: '#5b21b6',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 24px',
  textDecoration: 'none',
};

export const link: CSSProperties = {
  color: '#5b21b6',
  wordBreak: 'break-all',
};

export const muted: CSSProperties = {
  color: '#8a8a94',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '16px 0 0',
};

export const digestItem: CSSProperties = {
  borderTop: '1px solid #ececf1',
  padding: '12px 0',
};
