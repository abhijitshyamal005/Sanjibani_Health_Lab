/**
 * Home page promo banners.
 * To use a real photo instead of the built-in illustration, put the file in src/assets/banners/,
 * import it here and set `image` (and `imageAlt`) on the banner.
 *
 *   import familyPhoto from '../assets/banners/family.jpg';
 *   { ..., image: familyPhoto, imageAlt: 'Family smiling at home' }
 */
import family720 from '../assets/photos/family-720.webp';
import family1400 from '../assets/photos/family-1400.webp';
import homeVisit720 from '../assets/photos/home-visit-720.webp';
import homeVisit1400 from '../assets/photos/home-visit-1400.webp';
import labScientist720 from '../assets/photos/lab-scientist-720.webp';
import labScientist1400 from '../assets/photos/lab-scientist-1400.webp';
import senior720 from '../assets/photos/senior-720.webp';
import senior1400 from '../assets/photos/senior-1400.webp';

/** Responsive photo: browsers pick the smallest file that is sharp at the displayed size. */
const photo = (small, large) => ({ src: small, srcSet: `${small} 720w, ${large} 1400w` });
export const PHOTOS = {
  family: photo(family720, family1400),
  homeVisit: photo(homeVisit720, homeVisit1400),
  labScientist: photo(labScientist720, labScientist1400),
  senior: photo(senior720, senior1400),
};

export const BANNERS = [
  {
    id: 'home-collection',
    eyebrow: 'At your doorstep',
    title: 'Home sample collection from 6 AM',
    text: 'Certified phlebotomists, sealed kits and painless collection — book a slot that suits you.',
    cta: 'Book a home test',
    to: '/labs?home=1',
    gradient: 'from-brand-500 via-brand-600 to-brand-800',
    scene: 'homeVisit',
    image: PHOTOS.homeVisit,
    imageAlt: 'A phlebotomist with a sample kit greeting an elderly couple at their door',
    fade: 'from-brand-700 via-brand-700/85',
  },
  {
    id: 'full-body',
    eyebrow: 'Annual health check',
    title: 'Full body checkups from ₹1,149',
    text: 'Compare 60–90 parameter packages across NABL labs and save up to 65% on MRP.',
    cta: 'Compare packages',
    to: '/tests?category=Full%20Body%20Checkup',
    gradient: 'from-forest-from to-forest-to',
    scene: 'family',
    image: PHOTOS.family,
    imageAlt: 'A happy family of three laughing together on a sofa',
    fade: 'from-forest-from via-forest-from/85',
  },
  {
    id: 'seniors',
    eyebrow: 'For parents & seniors',
    title: 'Diabetes & heart care, tracked on your phone',
    text: 'HbA1c, lipid profile and cardiac markers with reports you can share with your doctor.',
    cta: 'View diabetes tests',
    to: '/tests?category=Diabetes',
    gradient: 'from-violet-600 via-indigo-700 to-indigo-900',
    scene: 'senior',
    image: PHOTOS.senior,
    imageAlt: 'A senior man smiling at his phone while his daughter points at the screen',
    fade: 'from-indigo-800 via-indigo-800/85',
  },
  {
    id: 'partner',
    eyebrow: 'For diagnostic labs',
    title: 'List your lab on Sanjibani — free',
    text: 'Reach new patients, manage tests & prices and run your bookings from one dashboard.',
    cta: 'Register your lab',
    to: '/register?role=lab',
    gradient: 'from-sky-600 via-cyan-700 to-brand-900',
    scene: 'doctor',
    image: PHOTOS.labScientist,
    imageAlt: 'A lab scientist loading sample tubes into a diagnostic analyser',
    fade: 'from-cyan-800 via-cyan-800/85',
  },
];
