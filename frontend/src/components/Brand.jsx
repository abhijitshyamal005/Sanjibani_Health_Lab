import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Microscope, TestTubes, FlaskConical, HeartPulse, Dna, Activity } from 'lucide-react';
import { initials } from '../lib/format';

/** The SanjiBani mark: a life-giving herb leaf with a pulse running through it. */
export function LogoMark({ className = 'h-9 w-9' }) {
  const id = `sjb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14532d" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${id})`} />
      <path d="M14 50C14 26 26 14 50 14C50 38 38 50 14 50Z" fill="#fff" />
      <path
        d="M9 36h12l4-9 6 17 4-11 3 3h17"
        fill="none"
        stroke="#f97316"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ to = '/', light = false, suffix }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="Sanjibani home">
      <LogoMark className="h-10 w-10" />
      <span className="flex flex-col leading-none">
        <span className="flex items-center text-xl font-bold tracking-tight">
          <span className={light ? 'text-brand-300' : 'text-brand-600'}>Sanji</span>
          <span className={light ? 'text-coral-300' : 'text-coral-600'}>Bani</span>
          {suffix && <span className="ml-1.5 text-xs font-bold uppercase tracking-wider text-coral-500">{suffix}</span>}
        </span>
        <span
          data-testid="logo-tagline"
          className={`mt-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] ${light ? 'text-white/60' : 'text-ink-muted'}`}
        >
          Health Lab
        </span>
      </span>
    </Link>
  );
}

const THEMES = [
  { from: '#0f766e', to: '#34d399', icon: Microscope },
  { from: '#1e3a8a', to: '#38bdf8', icon: TestTubes },
  { from: '#14532d', to: '#a3e635', icon: FlaskConical },
  { from: '#7c2d12', to: '#fb923c', icon: HeartPulse },
  { from: '#4c1d95', to: '#c084fc', icon: Dna },
  { from: '#134e4a', to: '#f95d35', icon: Activity },
];

/** Generated cover art for a lab — never a broken image. */
export function LabCover({ lab, className = '', size = 'md' }) {
  const theme = THEMES[(lab?.coverTheme ?? 0) % THEMES.length];
  const Icon = theme.icon;
  const id = `p-${lab?._id || 'x'}-${size}`;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 h-full w-full opacity-[.14]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="3" fill="#fff" />
            <circle cx="28" cy="22" r="5" fill="none" stroke="#fff" strokeWidth="2" />
            <path d="M6 6 L28 22" stroke="#fff" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
      <Icon className={`absolute text-white/25 ${size === 'lg' ? '-right-6 -bottom-8 h-52 w-52' : '-right-4 -bottom-5 h-28 w-28'}`} strokeWidth={1.25} />
      <div
        className={`absolute grid place-items-center rounded-2xl bg-white/95 font-extrabold text-ink shadow-lg ${
          size === 'lg' ? 'bottom-5 left-5 h-16 w-16 text-xl' : 'bottom-3 left-3 h-11 w-11 text-sm'
        }`}
        style={{ color: theme.from }}
      >
        {initials(lab?.name)}
      </div>
    </div>
  );
}
