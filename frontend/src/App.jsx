import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout, RequireAuth } from './components/Layouts';
import { Login, NotFound, Register } from './pages/Auth';
import CompareTests from './pages/CompareTests';
import Home from './pages/Home';
import LabDetail from './pages/LabDetail';
import Labs from './pages/Labs';
import Legal from './pages/Legal';
import { LegalSeo, NoIndex } from './components/PageSeo';
import { Spinner } from './components/ui';

// Dashboards and account pages load on demand so first-time visitors download less JavaScript.
const AdminApp = lazy(() => import('./admin/AdminApp'));
const PartnerApp = lazy(() => import('./partner/PartnerApp'));
const CollectorApp = lazy(() => import('./collector/CollectorApp'));
const Cart = lazy(() => import('./pages/Cart'));
const Profile = lazy(() => import('./pages/Profile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Invite = lazy(() => import('./pages/Invite'));
const BookingList = lazy(() => import('./pages/Bookings').then((m) => ({ default: m.BookingList })));
const BookingDetail = lazy(() => import('./pages/Bookings').then((m) => ({ default: m.BookingDetail })));

export default function App() {
  return (
    <Suspense fallback={<Spinner className="min-h-[60vh] items-center" />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="labs" element={<Labs />} />
        <Route path="labs/:slug" element={<LabDetail />} />
        <Route path="tests" element={<CompareTests />} />
        <Route path="cart" element={<><NoIndex /><Cart /></>} />
        <Route path="bookings" element={<><NoIndex /><RequireAuth roles={['patient']}><BookingList /></RequireAuth></>} />
        <Route path="bookings/:id" element={<><NoIndex /><RequireAuth roles={['patient']}><BookingDetail /></RequireAuth></>} />
        <Route path="profile" element={<><NoIndex /><RequireAuth roles={['patient']}><Profile /></RequireAuth></>} />
        <Route path="invite" element={<><NoIndex /><RequireAuth><Invite /></RequireAuth></>} />
        <Route path="legal/:page" element={<><LegalSeo /><Legal /></>} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="login" element={<><NoIndex /><Login /></>} />
      <Route path="register" element={<><NoIndex /><Register /></>} />
      <Route path="forgot-password" element={<><NoIndex /><ForgotPassword /></>} />
      <Route path="partner/*" element={<><NoIndex /><RequireAuth roles={['lab']}><PartnerApp /></RequireAuth></>} />
      <Route path="admin/*" element={<><NoIndex /><RequireAuth roles={['admin']}><AdminApp /></RequireAuth></>} />
      <Route path="collector/*" element={<><NoIndex /><RequireAuth roles={['collector']}><CollectorApp /></RequireAuth></>} />
    </Routes>
    </Suspense>
  );
}
