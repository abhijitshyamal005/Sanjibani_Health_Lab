import Navbar from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from './Footer';
import OfferHead from './OfferHead';

function AppLayout() {
  const location = useLocation();

  const isExcludedPage = ['/', '/Login', '/Signup'].includes(location.pathname);

  return (
    <>
      {!isExcludedPage && <OfferHead />}
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

export default AppLayout;