export const colors = {
  bg: '#0A0A0F',
  surface: '#16161D',
  surfaceRaised: '#20202A',
  border: '#2A2A36',
  text: '#FFFFFF',
  textMuted: '#A0A0AB',
  textDim: '#6B6B78',
  accent: '#C6F432',
  accentInk: '#0A0A0F',
  like: '#FF3B5C',
  scrim: 'rgba(0,0,0,0.55)',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export const type = {
  hero: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '500' },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 1.2 },
} as const;
