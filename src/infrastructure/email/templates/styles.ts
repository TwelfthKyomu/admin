import type { CSSProperties } from 'react';

const FONT = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';

export const body: CSSProperties = {
    margin: 0,
    backgroundColor: '#f4f4f5',
    fontFamily: FONT,
    color: '#18181b',
};

export const container: CSSProperties = {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '32px 24px',
    backgroundColor: '#ffffff',
};

export const brand: CSSProperties = {
    margin: '0 0 24px',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#71717a',
};

export const heading: CSSProperties = {
    margin: '0 0 12px',
    fontSize: '22px',
    lineHeight: '1.3',
    fontWeight: 700,
};

export const intro: CSSProperties = {
    margin: '0 0 20px',
    fontSize: '15px',
    lineHeight: '1.55',
};

export const detail: CSSProperties = {
    margin: '0 0 4px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#3f3f46',
};

export const divider: CSSProperties = {
    margin: '20px 0',
    borderColor: '#e4e4e7',
};

export const itemName: CSSProperties = {
    margin: '0 0 8px',
    fontSize: '14px',
    lineHeight: '1.5',
};

export const itemAmount: CSSProperties = {
    ...itemName,
    textAlign: 'right',
    whiteSpace: 'nowrap',
};

export const totalLabel: CSSProperties = {
    margin: '8px 0 0',
    fontSize: '15px',
    fontWeight: 700,
};

export const totalAmount: CSSProperties = {
    ...totalLabel,
    textAlign: 'right',
};

export const button: CSSProperties = {
    display: 'inline-block',
    marginTop: '24px',
    padding: '12px 22px',
    borderRadius: '8px',
    backgroundColor: '#18181b',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    textDecoration: 'none',
};

export const footer: CSSProperties = {
    margin: '28px 0 0',
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#a1a1aa',
};
