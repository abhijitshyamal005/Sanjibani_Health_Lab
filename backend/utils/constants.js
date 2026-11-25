export const ROLES = ['patient', 'lab', 'admin', 'collector'];

export const COLLECTION_TYPES = ['home', 'lab_visit', 'assisted_visit'];

/**
 * Field steps a collector (lab field staff) moves through before 'sample_collected'.
 * Assisted visit: pick the patient up at home, stay with them at the lab, then drop them home
 * ('dropped_home' is recorded after the sample is collected).
 */
export const FIELD_FLOW = {
  home: ['assigned', 'on_the_way', 'arrived'],
  assisted_visit: ['assigned', 'on_the_way', 'arrived', 'picked_up', 'reached_lab'],
};
export const FIELD_STATUSES = ['assigned', 'on_the_way', 'arrived', 'picked_up', 'reached_lab', 'dropped_home'];

export const CATEGORIES = [
  'Full Body Checkup',
  'Blood Tests',
  'Diabetes',
  'Thyroid',
  'Heart',
  'Liver',
  'Kidney',
  'Vitamins',
  'Fever & Infection',
  "Women's Health",
  'Hormones',
  'Allergy',
  'Urine & Stool',
  'Imaging',
];

export const ACCREDITATIONS = ['NABL', 'CAP', 'ISO 15189', 'NABH', 'ICMR'];

export const SAMPLE_TYPES = ['Blood', 'Urine', 'Stool', 'Swab', 'Saliva', 'None'];

export const LAB_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'sample_collected',
  'report_ready',
  'completed',
  'cancelled',
];

// Allowed forward transitions a lab can make on a booking.
export const BOOKING_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['sample_collected', 'cancelled'],
  sample_collected: ['report_ready'],
  report_ready: ['completed'],
  completed: [],
  cancelled: [],
};

export const CANCELLABLE_BY_PATIENT = ['pending', 'confirmed'];

export const TIME_SLOTS = [
  '06:00-07:00',
  '07:00-08:00',
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '16:00-17:00',
  '17:00-18:00',
  '18:00-19:00',
];

export const MAX_BOOKING_DAYS_AHEAD = 30;
