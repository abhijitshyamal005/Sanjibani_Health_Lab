# Sanjibani — Product Requirements Document

**Version:** 1.0 (MVP) · **Date:** 2026-11-25

## 1. One-liner

Sanjibani is a marketplace for diagnostic laboratories, in the way Swiggy and Zomato are marketplaces for restaurants. Labs register and list their tests and packages with prices. Patients discover nearby labs, compare prices for the same test across labs, and book a home sample collection or a lab visit.

## 2. Problem

- Patients can't easily compare test prices, turnaround times and accreditations across labs. The same CBC can cost ₹200 at one lab and ₹600 at another.
- Small and mid-size labs have no cheap way to get found online or take bookings.

## 3. Users and roles

| Role | Who | Core jobs |
|---|---|---|
| **Patient** | Anyone booking a test | Find labs, compare prices, book, track status, review |
| **Lab partner** | Owner or manager of a diagnostic lab | Register lab, manage test catalogue and prices, handle bookings, update status |
| **Admin** | Sanjibani operations | Approve or reject labs, monitor users, bookings and platform stats |
| **Collector** (lab field staff) | A phlebotomist or field executive employed by a lab. The lab creates the account | See assigned jobs only, with no prices. Collect samples at home or escort patients for assisted visits. Update each step and record cash. See own earnings |

## 4. Swiggy/Zomato → Sanjibani mapping

| Food delivery | Sanjibani |
|---|---|
| Restaurant | Laboratory |
| Menu item | Test / health package |
| Cuisine | Test category (Diabetes, Thyroid, Full Body…) |
| Delivery / pickup | Home sample collection, a lab visit (slot booking), or an assisted visit (staff pickup → lab → drop home) |
| Delivery partner | Sample collector (lab field staff) |
| Delivery fee | Home collection fee |
| Order tracking | Booking status: Pending → Confirmed → Sample collected → Report ready → Completed |
| Restaurant partner app | Lab partner dashboard |
| Cart (one restaurant at a time) | Cart (one lab at a time) |

## 5. MVP scope

### 5.1 Patient
1. Sign up and log in with email and password.
2. **Home:** search a test or lab, pick a city, browse categories, popular tests and top-rated labs.
3. **Labs listing:** filter by city, category and home collection; sort by rating, price or name.
4. **Lab page:** cover, rating, accreditations (NABL/CAP/ISO), report turnaround, home collection fee, and a test catalogue grouped by category with in-page search. Reviews are shown too.
5. **Compare a test:** search "HbA1c" and see every approved lab offering it, sorted by price.
6. **Cart:** tests from one lab only. Adding a test from another lab asks to replace the cart, as Swiggy does.
7. **Checkout:** collection type (home or lab visit), date and time slot, patient details (name, age, gender, phone), and an address for home collection. Payment is **pay at collection** in the MVP.
8. **My bookings:** list, detail with a status timeline, cancel while pending or confirmed, and rate and review the lab once the booking is completed.

### 5.2 Lab partner
1. Register as a lab partner, then complete lab onboarding: name, description, address, city, contact, timings, accreditations, home collection fee, and report time.
2. A new lab is **Pending** until an admin approves it. Only approved labs are visible to patients.
3. **Tests:** create, edit, enable or disable, and delete tests and packages. Each has a name, category, type (test or package), description, parameters included, sample type, preparation, MRP, offer price, report time and home-collection eligibility.
4. **Bookings:** filter by status and advance the status. Add a report note when the report is ready.
5. **Dashboard:** total bookings, pending bookings, completed bookings, revenue from completed bookings, active tests and rating.

### 5.2a Visit modes and field staff
- **Home collection:** for home-collectable tests. The lab assigns a collector, who goes through *assigned → on the way → arrived → sample collected*. The collector can record cash collected.
- **Lab visit:** the patient books a time slot at the lab. This mode is required for tests that can't be collected at home, such as imaging. Each slot has a per-lab capacity (default 4 per mode per slot). Full or past slots can't be booked, and an availability endpoint shows the free spots.
- **Assisted visit:** for labs that offer it, and for any test, including lab-only ones. Field staff go through *assigned → on the way → arrived → picked up → reached lab → sample collected → dropped home*. An assisted-visit fee applies.
- **Collector payouts:** each lab sets a private payout per home job and per assisted job. Each job keeps a snapshot of the payout at the time of assignment. Collectors see today, last-7-days and month earnings; labs see each collector's month earnings for payroll.

### 5.3 Admin
1. Platform stats: users, labs by status, bookings and gross booking value.
2. Approve, reject or suspend labs.
3. View users and all bookings.

### 5.4 Out of scope for the MVP (next phases)
Online payments (Razorpay), OTP/SMS login, PDF report upload and download, geolocation and "near me" distance sort, coupons, phlebotomist assignment, notifications (email, SMS, WhatsApp), multiple branches per lab, prescription upload.

## 6. Business rules
- Prices are always recomputed on the server. Client-sent prices are ignored.
- A booking contains tests from exactly one approved lab, and every test must be active.
- Home collection is allowed only if the lab offers it and every test in the cart is home-collection eligible. The lab's home collection fee is added.
- Offer price must be less than or equal to MRP.
- Booking status can only move forward: `pending → confirmed → sample_collected → report_ready → completed`. `cancelled` is allowed only from `pending` or `confirmed`, and either the patient or the lab can cancel.
- One review per completed booking. The lab's rating is the running average of its reviews.
- A lab partner owns exactly one lab and can only see or edit their own lab, tests and bookings.
- Collectors are created by their lab, only see jobs assigned to them, and never see prices, discounts or coupon details. They only see the amount to collect.
- A collector can only be assigned to home collections and assisted visits, before the sample is collected. Assigning a pending booking confirms it.
- Bookings per slot are limited per lab and per mode (`slotCapacity`). Slots whose start time has passed (IST) can't be booked.

## 7. Non-functional requirements
- JWT auth with bcrypt-hashed passwords. Role-based access control on every protected route.
- Input validation, with clear error messages returned as `{ message }`.
- Responsive UI that works on phones first.
- Automated API test suite covering auth, roles, the booking flow and business rules.

## 8. Tech
- **Backend:** Node.js, Express 5, MongoDB with Mongoose, and `jose` for JWT. Tests use `node:test`, `supertest` and `mongodb-memory-server`.
- **Frontend:** React 18, Vite, Tailwind CSS, React Router and lucide-react icons.
- **Local development:** runs without installing MongoDB, using an embedded database that is seeded with demo data.

## 9. Success metrics (post-launch)
Labs onboarded, approved labs per city, search-to-booking conversion, bookings per week, cancellation rate, average rating and report turnaround time.
