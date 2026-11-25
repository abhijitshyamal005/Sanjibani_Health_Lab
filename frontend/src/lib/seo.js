import { useEffect, useLayoutEffect } from 'react';

/** The one address search engines should index. Copies on onrender.com / vercel.app point here. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://sanjibanilabs.dpdns.org').replace(/\/$/, '');
export const SITE_NAME = 'Sanjibani';
export const DEFAULT_TITLE = 'Sanjibani — Book lab tests from trusted labs near you';
export const DEFAULT_DESCRIPTION =
  'Compare lab test prices across trusted diagnostic labs near you and book home sample collection in minutes.';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const JSON_LD_ID = 'seo-jsonld';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(data) {
  let el = document.getElementById(JSON_LD_ID);
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = JSON_LD_ID;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Trims text to a search-snippet friendly length without cutting a word in half. */
export function clip(text, max = 158) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, t.lastIndexOf(' ', max - 1))}…`;
}

export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function apply({ title, description, path, image, type = 'website', noindex = false, jsonLd = null }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = clip(description || DEFAULT_DESCRIPTION);
  const url = absoluteUrl(path ?? window.location.pathname);
  const img = image || DEFAULT_IMAGE;

  document.title = fullTitle;
  setMeta('name', 'description', desc);
  setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
  setCanonical(url);

  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', img);
  setMeta('property', 'og:locale', 'en_IN');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', fullTitle);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image', img);

  setJsonLd(jsonLd);
}

/**
 * Sets title, description, canonical URL, share-preview tags and structured data for a page.
 * Pass the values once data has loaded; re-runs whenever they change.
 */
export function useSeo(options) {
  const key = JSON.stringify(options);
  useEffect(() => {
    apply(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/**
 * Resets to site defaults on every route change. Runs as a layout effect so it lands before
 * a page's own useSeo (a passive effect), which then overrides it.
 */
export function useSeoDefaults(pathname) {
  useLayoutEffect(() => {
    apply({ path: pathname });
  }, [pathname]);
}

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Sanjibani Health',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-512.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-IN',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/tests?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export function breadcrumbJsonLd(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

/** schema.org DiagnosticLab with address, hours, rating and a price list of its tests. */
export function labJsonLd(lab, tests = []) {
  const url = absoluteUrl(`/labs/${lab.slug}`);
  const prices = tests.map((t) => t.price).filter((p) => typeof p === 'number');
  const node = {
    '@type': 'DiagnosticLab',
    '@id': `${url}#lab`,
    name: lab.name,
    url,
    image: DEFAULT_IMAGE,
    description: lab.description || lab.tagline,
    telephone: lab.phone || undefined,
    foundingDate: lab.establishedYear ? String(lab.establishedYear) : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [lab.address?.line, lab.address?.area].filter(Boolean).join(', '),
      addressLocality: lab.address?.city,
      postalCode: lab.address?.pincode,
      addressCountry: 'IN',
    },
    openingHoursSpecification:
      lab.opensAt && lab.closesAt
        ? [{
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: lab.opensAt,
            closes: lab.closesAt,
          }]
        : undefined,
    priceRange: prices.length ? `₹${Math.min(...prices)} - ₹${Math.max(...prices)}` : undefined,
    aggregateRating:
      lab.ratingCount > 0
        ? { '@type': 'AggregateRating', ratingValue: lab.rating, reviewCount: lab.ratingCount, bestRating: 5, worstRating: 1 }
        : undefined,
    hasOfferCatalog: tests.length
      ? {
          '@type': 'OfferCatalog',
          name: `Tests at ${lab.name}`,
          itemListElement: tests.slice(0, 50).map((t) => ({
            '@type': 'Offer',
            price: t.price,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            itemOffered: { '@type': 'MedicalTest', name: t.name, description: clip(t.description, 200) || undefined },
          })),
        }
      : undefined,
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      node,
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Labs', path: '/labs' },
        { name: lab.name, path: `/labs/${lab.slug}` },
      ]),
    ],
  };
}
