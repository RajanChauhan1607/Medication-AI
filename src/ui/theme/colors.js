// theme/colors.js — Medication AI design tokens (1:1 with the prototype's CSS variables)
// Medical bluish-green system: white floating cards on cool mint paper.

export const C = {
  paper: '#EDF4F4',
  paper2: '#DEEAEA',
  surface: '#FFFFFF',
  surfaceWarm: '#F4FAFA',

  ink: '#10282C',
  inkSoft: '#3E5B60',
  inkFaint: '#6E898D',
  line: '#CFE0E1',
  lineSoft: '#E0ECEC',

  primary: '#0E7C86',
  primaryPress: '#0A5E66',
  primaryTint: '#D6EDEF',
  deep: '#0B3F46',
  deep2: '#0E5560',
  mint: '#6FE3C2',
  coral: '#E8604C',

  sage: '#1D9266',
  sageTint: '#D6F0E4',
  amber: '#C98A2D',
  amberTint: '#F6EBD2',
  berry: '#D0503F',
  berryTint: '#F9E0DB',
};

// Type families (loaded via @expo-google-fonts in App.js)
export const F = {
  display: 'Outfit_700Bold',
  displayMed: 'Outfit_600SemiBold',
  ui: 'Figtree_400Regular',
  uiMed: 'Figtree_600SemiBold',
  uiBold: 'Figtree_700Bold',
  uiHeavy: 'Figtree_800ExtraBold',
  script: 'Caveat_600SemiBold',
};

// Accent palettes available in the prototype's Tweaks panel.
export const ACCENTS = [
  { primary: '#0E7C86', press: '#0A5E66', tint: '#D6EDEF' }, // medical teal (default)
  { primary: '#0B8A6B', press: '#076B53', tint: '#D4EFE6' }, // jade
  { primary: '#1273A6', press: '#0D5A83', tint: '#D8EAF5' }, // sea blue
  { primary: '#3D8A4E', press: '#2E6C3C', tint: '#DCEFDF' }, // clinic green
];

export const MED_COLORS = ['#DC7A57', '#6E9B6B', '#D99A3E', '#C75B6B', '#8A6BC4', '#4E8FAE'];

// Per-dose-status visual treatment (mirror of DOSE_STATE in ui.jsx)
export const DOSE_STATE = {
  taken: { label: 'Taken', color: C.sage, tint: C.sageTint, icon: 'check' },
  due: { label: 'Due now', color: C.primary, tint: C.primaryTint, icon: 'bell' },
  upcoming: { label: 'Upcoming', color: C.inkFaint, tint: C.paper2, icon: 'clock' },
  skipped: { label: 'Skipped', color: C.berry, tint: C.berryTint, icon: 'x' },
};
