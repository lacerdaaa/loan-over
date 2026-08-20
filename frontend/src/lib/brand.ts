export type LandingMode = 'personal' | 'business';

export interface LandingPalette {
  bg: string;      // page background
  hero: string;    // hero + CTA section background
  deep: string;    // footer + CTA-card background
  accent: string;  // kickers, dots, numerals, chips
  ink: string;     // headings/body on light zones
  inkMuted: string;
  line: string;    // hairline borders
  surface: string; // raised elements (chips) on content zones
}

export const PALETTES: Record<LandingMode, LandingPalette> = {
  personal: {
    bg: 'oklch(98.5% 0.007 145)',
    hero: 'oklch(66% 0.179 155)',
    deep: 'oklch(28% 0.055 155)',
    accent: 'oklch(66% 0.179 155)',
    ink: 'oklch(25% 0.045 155)',
    inkMuted: 'oklch(25% 0.045 155 / 0.55)',
    line: 'oklch(66% 0.179 155 / 0.18)',
    surface: 'oklch(100% 0 0)',
  },
  business: {
    bg: 'oklch(22% 0.02 250)',
    hero: 'oklch(27% 0.025 250)',
    deep: 'oklch(16% 0.02 250)',
    accent: 'oklch(60% 0.12 250)',
    ink: 'oklch(93% 0.01 250)',
    inkMuted: 'oklch(93% 0.01 250 / 0.55)',
    line: 'oklch(60% 0.12 250 / 0.22)',
    surface: 'oklch(27% 0.025 250)',
  },
};
