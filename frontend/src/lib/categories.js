import {
  Activity,
  Bean,
  Beaker,
  Droplet,
  Droplets,
  FlaskConical,
  Flower2,
  HeartPulse,
  Dna,
  ScanLine,
  ShieldCheck,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';

export const CATEGORY_META = {
  'Full Body Checkup': { icon: ShieldCheck, color: 'bg-brand-50 text-brand-700', blurb: 'Complete annual check' },
  'Blood Tests': { icon: Droplet, color: 'bg-rose-50 text-rose-600', blurb: 'CBC, iron & more' },
  Diabetes: { icon: Droplets, color: 'bg-sky-50 text-sky-600', blurb: 'Sugar & HbA1c' },
  Thyroid: { icon: Activity, color: 'bg-violet-50 text-violet-600', blurb: 'T3, T4, TSH' },
  Heart: { icon: HeartPulse, color: 'bg-red-50 text-red-600', blurb: 'Lipids & cardiac' },
  Liver: { icon: FlaskConical, color: 'bg-amber-50 text-amber-700', blurb: 'LFT panel' },
  Kidney: { icon: Bean, color: 'bg-orange-50 text-orange-600', blurb: 'KFT panel' },
  Vitamins: { icon: Sun, color: 'bg-yellow-50 text-yellow-700', blurb: 'D, B12 & more' },
  'Fever & Infection': { icon: Thermometer, color: 'bg-coral-50 text-coral-600', blurb: 'Dengue, typhoid' },
  "Women's Health": { icon: Flower2, color: 'bg-pink-50 text-pink-600', blurb: 'PCOD & hormones' },
  Hormones: { icon: Dna, color: 'bg-indigo-50 text-indigo-600', blurb: 'Testosterone & more' },
  Allergy: { icon: Wind, color: 'bg-teal-50 text-teal-600', blurb: 'Food & inhalants' },
  'Urine & Stool': { icon: Beaker, color: 'bg-lime-50 text-lime-700', blurb: 'Routine exams' },
  Imaging: { icon: ScanLine, color: 'bg-slate-100 text-slate-700', blurb: 'X-ray & scans' },
};

export const CATEGORIES = Object.keys(CATEGORY_META);

export function categoryMeta(name) {
  return CATEGORY_META[name] || { icon: FlaskConical, color: 'bg-brand-50 text-brand-700', blurb: '' };
}

export const ACCREDITATIONS = ['NABL', 'CAP', 'ISO 15189', 'NABH', 'ICMR'];
export const SAMPLE_TYPES = ['Blood', 'Urine', 'Stool', 'Swab', 'Saliva', 'None'];
