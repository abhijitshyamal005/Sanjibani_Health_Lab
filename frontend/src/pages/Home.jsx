import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  FileText,
  House,
  IndianRupee,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';
import BannerCarousel from '../components/BannerCarousel';
import { Faq, OfferStrip, Testimonials, TrustStats } from '../components/HomeSections';
import SearchBar from '../components/SearchBar';
import { LabCardSkeleton } from '../components/Skeletons';
import doctorPhoto from '../assets/photos/doctor-600.webp';
import { CategoryTile, LabCard } from '../components/Cards';
import { CitySelect } from '../components/Navbar';
import { SectionTitle } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { categoryMeta } from '../lib/categories';
import { inr } from '../lib/format';
import { organizationJsonLd, useSeo } from '../lib/seo';
import { useAsync } from '../lib/useAsync';

const STEPS = [
  { icon: Search, title: 'Compare', text: 'Search any test and see prices, ratings and report times across labs.' },
  { icon: CalendarClock, title: 'Book a slot', text: 'Pick home collection or a lab visit at a time that suits you.' },
  { icon: FileText, title: 'Get your report', text: 'Track every step and get notified when your report is ready.' },
];

export default function Home() {
  const { meta, city } = useApp();
  const navigate = useNavigate();
  const labs = useAsync(() => api('/labs', { params: { city, limit: 8 } }), [city]);
  useSeo({
    title: 'Book lab tests online — compare prices from trusted labs',
    description: `Compare blood test and health checkup prices across ${meta?.stats.labs || 'trusted'} NABL-accredited labs${meta?.cities?.length ? ` in ${meta.cities.join(', ')}` : ''}. Book home sample collection and get reports online.`,
    path: '/',
    jsonLd: organizationJsonLd,
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-canvas">
        <div className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
              <Sparkles className="h-3.5 w-3.5 text-coral-500" /> {meta?.stats.labs || 'Trusted'} verified labs · {meta?.stats.cities || ''} cities
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              Lab tests from labs you trust, at the <span className="text-brand-600">best price</span> near you
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              Compare prices across accredited diagnostic labs, book a home sample collection in under a minute, and track your report.
            </p>
            <div className="mt-7 flex max-w-xl flex-col gap-3 sm:flex-row">
              <CitySelect className="sm:hidden" />
              <SearchBar large />
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="text-ink-muted">Popular:</span>
              {['CBC', 'Thyroid', 'Vitamin D', 'HbA1c', 'Full Body'].map((t) => (
                <Link key={t} to={`/tests?q=${encodeURIComponent(t)}`} className="font-semibold text-brand-700 hover:underline">
                  {t}
                </Link>
              ))}
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-4 text-sm">
              {[
                [BadgeCheck, 'NABL labs'],
                [House, 'Home collection'],
                [IndianRupee, 'Pay at visit'],
              ].map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-2 font-semibold text-ink-soft">
                  <Icon className="h-5 w-5 shrink-0 text-brand-600" /> {label}
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -right-4 -top-4 h-40 w-40 rounded-full bg-brand-200/80 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-6 -left-6 h-48 w-48 rounded-full bg-coral-100 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2.5rem] rounded-tr-[6rem] shadow-lift ring-8 ring-white">
              <img
                src="/img/hero-560.webp"
                srcSet="/img/hero-560.webp 560w, /img/hero-1040.webp 1040w"
                sizes="(min-width: 768px) 520px, calc(100vw - 32px)"
                width="520"
                height="520"
                alt="A smiling phlebotomist holding a blood sample tube beside a patient at home"
                className="aspect-square w-full object-cover"
                loading="eager"
                // React 18 passes this through only in lowercase (camelCase support arrived in React 19)
                // eslint-disable-next-line react/no-unknown-property
                fetchpriority="high"
                decoding="async"
              />
            </div>
            <div className="absolute left-0 top-[10%] flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-lift animate-[float_5s_ease-in-out_infinite]" aria-hidden="true">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">✓</span>
              <div>
                <p className="text-[11px] font-medium text-ink-muted">Report ready</p>
                <p className="text-xs font-bold">Thyroid Profile</p>
              </div>
            </div>
            <div className="absolute bottom-[6%] right-[2%] rounded-2xl bg-ink px-3 py-2 text-white shadow-lift animate-[float_6s_ease-in-out_infinite_1s]" aria-hidden="true">
              <p className="text-[11px] text-white/70">Home collection</p>
              <p className="text-xs font-bold">Tomorrow, 7 – 8 AM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promo banners */}
      <section className="container-page -mt-4 md:-mt-8">
        <BannerCarousel />
        <div className="mt-6">
          <OfferStrip />
        </div>
      </section>

      {/* Categories */}
      <section className="container-page mt-12">
        <SectionTitle title="Browse by health concern" subtitle="Tests and packages grouped the way doctors order them" />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
          {(meta?.categories || [])
            .filter((c) => c.count > 0)
            .map((c) => (
              <CategoryTile key={c.name} category={c} onClick={() => navigate(`/tests?category=${encodeURIComponent(c.name)}`)} />
            ))}
        </div>
      </section>

      {/* Popular tests */}
      {meta?.popularTests?.length > 0 && (
        <section className="container-page mt-14">
          <SectionTitle
            title="Most booked tests"
            subtitle="Tap to compare prices across labs"
            action={
              <Link to="/tests" className="hidden items-center gap-1 text-sm font-bold text-brand-700 hover:underline sm:flex">
                All tests <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {meta.popularTests.map((t) => {
              const m = categoryMeta(t.category);
              const Icon = m.icon;
              return (
                <Link key={t.name} to={`/tests?q=${encodeURIComponent(t.name)}`} className="card group flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-center justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${m.color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">{t.labCount} labs</span>
                  </div>
                  <p className="mt-3 flex-1 font-bold leading-snug group-hover:text-brand-700">{t.name}</p>
                  <p className="mt-3 text-sm text-ink-muted">
                    from <span className="text-base font-extrabold text-ink">{inr(t.minPrice)}</span>{' '}
                    {t.maxMrp > t.minPrice && <span className="line-through">{inr(t.maxMrp)}</span>}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Labs */}
      <section className="container-page mt-14">
        <SectionTitle
          title={city ? `Top labs in ${city}` : 'Top rated labs'}
          subtitle="Verified by our team before going live"
          action={
            <Link to="/labs" className="flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {labs.loading && !labs.data ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <LabCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {labs.data?.items.map((lab) => <LabCard key={lab._id} lab={lab} />)}
          </div>
        )}
        {labs.data?.items.length === 0 && <p className="text-ink-muted">No labs in {city} yet — try another city.</p>}
      </section>

      <section className="container-page mt-14">
        <TrustStats />
      </section>

      {/* How it works */}
      <section className="container-page mt-16">
        <div className="rounded-4xl bg-white p-6 shadow-card sm:p-10">
          <SectionTitle title="How Patholy works" />
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="flex gap-4">
                <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-coral-500 text-[11px] font-bold">{i + 1}</span>
                </div>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm text-ink-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <Faq />

      {/* Partner CTA */}
      <section className="container-page mt-16">
        <div className="grid items-center gap-8 overflow-hidden rounded-4xl bg-gradient-to-r from-forest-from to-forest-to p-8 text-white sm:p-12 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
              <Store className="h-3.5 w-3.5" /> For diagnostic labs
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Get your lab in front of thousands of patients</h2>
            <p className="mt-3 text-white/75">
              List your tests and prices, accept bookings, manage home collections and track revenue from one simple dashboard. No setup fee.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/85">
              {['Free listing — go live after a quick verification', 'Manage tests, packages & pricing yourself', 'Booking pipeline from sample to report'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-coral-300" /> {t}
                </li>
              ))}
            </ul>
            <Link to="/register?role=lab" className="mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 px-6 font-bold text-white hover:from-brand-700 hover:to-brand-500">
              Register your lab <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden justify-center md:flex">
            <div className="relative">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-coral-500/80" aria-hidden="true" />
              <img src={doctorPhoto} alt="A smiling doctor in a white coat holding a tablet" className="relative h-[380px] w-[300px] rounded-[2rem] object-cover object-top shadow-lift" width="300" height="380" loading="lazy" decoding="async" />
              <div className="absolute -left-10 bottom-10 rounded-2xl bg-white px-4 py-3 text-ink shadow-lift">
                <p className="text-xs text-ink-muted">Listing fee</p>
                <p className="text-xl font-extrabold text-brand-700">₹0</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
