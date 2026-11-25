import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { BANNERS } from '../lib/banners';
import { DoctorScene, FamilyScene, HomeVisitScene, SeniorScene } from './People';

const SCENES = { homeVisit: HomeVisitScene, doctor: DoctorScene, family: FamilyScene, senior: SeniorScene };

function Slide({ banner }) {
  const Scene = SCENES[banner.scene];
  return (
    <div className={`relative flex h-full w-full shrink-0 snap-center overflow-hidden rounded-3xl bg-gradient-to-br ${banner.gradient}`}>
      {banner.image ? (
        <>
          <img
            src={banner.image.src}
            srcSet={banner.image.srcSet}
            sizes="(min-width: 640px) 62vw, 100vw"
            alt={banner.imageAlt || ''}
            className="absolute inset-y-0 right-0 h-full w-full object-cover object-[70%_30%] sm:w-[62%] sm:[mask-image:linear-gradient(to_right,transparent,black_30%)]"
            loading="lazy"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${banner.fade} to-transparent sm:via-40% sm:to-70%`} />
        </>
      ) : (
        Scene && (
          <div className="pointer-events-none absolute -right-10 bottom-0 h-[85%] w-[55%] sm:right-0 sm:w-[44%]">
            <Scene className="h-full w-full opacity-40 sm:opacity-100" />
          </div>
        )
      )}
      <div className="relative z-10 flex flex-1 flex-col justify-center p-6 sm:py-10 sm:pl-16 sm:pr-6">
        <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur-sm">{banner.eyebrow}</span>
        <h2 className="mt-3 max-w-md text-2xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-3xl">{banner.title}</h2>
        <p className="mt-2 max-w-sm text-sm text-white/85 sm:text-base">{banner.text}</p>
        <Link to={banner.to} className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm hover:bg-white/90">
          {banner.cta} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/** Auto-rotating promo banners, swipeable on touch (scroll-snap) with arrows and dots. */
export default function BannerCarousel() {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((i) => {
    const track = trackRef.current;
    if (!track) return;
    const n = (i + BANNERS.length) % BANNERS.length;
    track.scrollTo({ left: n * track.clientWidth, behavior: 'smooth' });
    setIndex(n);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const t = setInterval(() => goTo(index + 1), 5500);
    return () => clearInterval(t);
  }, [index, paused, goTo]);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Offers"
    >
      <div ref={trackRef} onScroll={onScroll} className="scrollbar-none flex h-[260px] snap-x snap-mandatory gap-0 overflow-x-auto sm:h-[300px]">
        {BANNERS.map((b, i) => (
          <div key={b.id} className="h-full w-full shrink-0 snap-center" aria-roledescription="slide" aria-label={`${i + 1} of ${BANNERS.length}`} aria-hidden={i !== index} inert={i !== index ? '' : undefined}>
            <Slide banner={b} />
          </div>
        ))}
      </div>
      <button onClick={() => goTo(index - 1)} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-card hover:bg-white sm:block" aria-label="Previous offer">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => goTo(index + 1)} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-card hover:bg-white sm:block" aria-label="Next offer">
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="mt-2 flex justify-center gap-0.5">
        {BANNERS.map((b, i) => (
          // 24px tap target around a small visual dot
          <button key={b.id} onClick={() => goTo(i)} aria-label={`Go to offer ${i + 1}`} aria-current={i === index} className="grid h-6 min-w-6 place-items-center px-1">
            <span className={`block h-2 rounded-full transition-all ${i === index ? 'w-6 bg-brand-700' : 'w-2 bg-slate-400'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
