export const colors = {
  gray: {
    0:   '#FFFFFF',
    50:  '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  blue: {
    100: '#E8EDF2',
    200: '#C2D0DE',
    300: '#8AAABF',
    400: '#5C82A0',
    500: '#3D6480',
    600: '#254A64',
    700: '#122333',
  },
  blob: ['#0D1B2A', '#1B3550', '#2E5F82', '#5C8FB0', '#A0C4D8', '#D8E8F0'],
} as const

export const radius = {
  sm:   '2px',
  md:   '6px',
  lg:   '12px',
  xl:   '20px',
  full: '9999px',
} as const

export const shadows = {
  sm:     '0 1px 3px rgba(0,0,0,0.08)',
  md:     '0 4px 16px rgba(0,0,0,0.12)',
  lg:     '0 8px 32px rgba(0,0,0,0.16)',
  accent: '0 0 24px rgba(92,130,160,0.3)',
} as const
