import { Route, Routes } from 'react-router-dom';
import AdminApp from './admin/AdminApp';
import CollectorApp from './collector/CollectorApp';
import { PublicLayout, RequireAuth } from './components/Layouts';
import PartnerApp from './partner/PartnerApp';
import { Login, NotFound, Register } from './pages/Auth';
import { BookingDetail, BookingList } from './pages/Bookings';
import Cart from './pages/Cart';
import CompareTests from './pages/CompareTests';
import Home from './pages/Home';
import LabDetail from './pages/LabDetail';
import Labs from './pages/Labs';
import Legal from './pages/Legal';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="labs" element={<Labs />} />
        <Route path="labs/:slug" element={<LabDetail />} />
        <Route path="tests" element={<CompareTests />} />
        <Route path="cart" element={<Cart />} />
        <Route path="bookings" element={<RequireAuth roles={['patient']}><BookingList /></RequireAuth>} />
        <Route path="bookings/:id" element={<RequireAuth roles={['patient']}><BookingDetail /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth roles={['patient']}><Profile /></RequireAuth>} />
        <Route path="legal/:page" element={<Legal />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="partner/*" element={<RequireAuth roles={['lab']}><PartnerApp /></RequireAuth>} />
      <Route path="admin/*" element={<RequireAuth roles={['admin']}><AdminApp /></RequireAuth>} />
      <Route path="collector/*" element={<RequireAuth roles={['collector']}><CollectorApp /></RequireAuth>} />
    </Routes>
  );
}
