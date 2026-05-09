import type { Theme } from './store'

export const themes: Record<Theme, {
  bg: string; surface: string; border: string; text: string;
  textMuted: string; accent: string; accentText: string; navBg: string;
}> = {
  dark: {
    bg:          'bg-gray-950',
    surface:     'bg-gray-900',
    border:      'border-gray-800',
    text:        'text-white',
    textMuted:   'text-gray-400',
    accent:      'bg-indigo-600',
    accentText:  'text-indigo-400',
    navBg:       'bg-gray-900 border-gray-800',
  },
  light: {
    bg:          'bg-gray-50',
    surface:     'bg-white',
    border:      'border-gray-200',
    text:        'text-gray-900',
    textMuted:   'text-gray-500',
    accent:      'bg-indigo-600',
    accentText:  'text-indigo-600',
    navBg:       'bg-white border-gray-200',
  },
  midnight: {
    bg:          'bg-slate-950',
    surface:     'bg-slate-900',
    border:      'border-slate-700',
    text:        'text-slate-100',
    textMuted:   'text-slate-400',
    accent:      'bg-violet-600',
    accentText:  'text-violet-400',
    navBg:       'bg-slate-900 border-slate-700',
  },
  ocean: {
    bg:          'bg-cyan-950',
    surface:     'bg-cyan-900',
    border:      'border-cyan-800',
    text:        'text-cyan-50',
    textMuted:   'text-cyan-400',
    accent:      'bg-teal-500',
    accentText:  'text-teal-400',
    navBg:       'bg-cyan-900 border-cyan-800',
  },
}
