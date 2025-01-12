import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollTop.jsx';

import './App.css';
import CarouselComponent from './components/CarouselComponent';
import Checkups from './components/Checkups';
import Hero from './components/Hero';
import InfoCard from './components/InfoCard';
import Slider1 from './components/Slider1';
import PhotoSlider from './components/PhotoSlider';
import BodyOrgans from './components/BodyOrgans';
import WhatsappImg from './components/WhatsappImg.jsx';
import Testimonial from './components/Testimonial.jsx';
import LastImgSec from './components/LastImgSec.jsx';
import Footer from './components/Footer.jsx';
import AppLayout from './components/AppLayoyt.jsx';
import Home from './pages/Home.jsx';           // Assuming Home component exists
import WithoutHeaderFotter from './components/WithoutHeaderFotter.jsx';
import NotFound from './pages/Not-found.jsx';
import LabTest from './pages/LabTest.jsx'
import Checkup from './pages/Checkup.jsx';
import FullBodyEs from './components/ViewDetails/FullBodyCheckupEs.jsx';
import FullBodyCos from './components/ViewDetails/FullBodyCheckupCos.jsx';
import FullBody  from './pages/FullBody.jsx';
import Heart from './pages/Heart.jsx';

import Liver from './pages/Liver.jsx';

import Kidney from './pages/Kidney.jsx';  

import Fiver from './pages/Fiver.jsx';

import SexHealth from './pages/SexHealth.jsx';


const router = {
  home: '/',
  Hero: '/hero',
  CarouselComponent: '/carousel',
  Checkups: '/checkups',
  InfoCard: '/infoCard',
  Slider1: '/slider1',
  PhotoSlider: '/photoSlider',
  BodyOrgans: '/bodyOrgans',
  WhatsappImg: '/whatsappImg',
  Testimonial: '/testimonial',
  LastImgSec: '/lastImgSec',
  Footer: '/footer',
  notFound: '/not-found',
  LabTest: '/labtest',
  Checkup: '/checkup',
  FullBodyEs: '/full-body-es',
  FullBodyCos: '/full-body-cos',
  FullBody: '/full-body',
  Heart: '/heart',
  Liver: '/liver',
  Kidney: '/kidney',
  Fiver: '/fiver',
  SexHealth: '/sex-health',
  
  // Route for Full Body Checkup Details
  
  // Add more routes as needed
};

function App() {
  return (
    <>
      {/* ScrollToTop should be outside the Routes component */}
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path={router.Hero} element={<Hero />} />
          <Route path={router.CarouselComponent} element={<CarouselComponent />} />
          <Route path={router.Checkups} element={<Checkups />} />
          <Route path={router.InfoCard} element={<InfoCard />} />
          <Route path={router.Slider1} element={<Slider1 />} />
          <Route path={router.PhotoSlider} element={<PhotoSlider />} />
          <Route path={router.BodyOrgans} element={<BodyOrgans />} />
          <Route path={router.WhatsappImg} element={<WhatsappImg />} />
          <Route path={router.Testimonial} element={<Testimonial />} />
          <Route path={router.LastImgSec} element={<LastImgSec />} />
          <Route path={router.Footer} element={<Footer />} />
          <Route path={router.LabTest} element={<LabTest />} /> 
          <Route path={router.Checkup} element={<Checkup />} /> 
          <Route path={router.FullBodyEs} element={<FullBodyEs />} />
          <Route path={router.FullBodyCos} element={<FullBodyCos />} />
          <Route path={router.FullBody} element={<FullBody/>} />
          <Route path={router.Heart} element={<Heart/>} />
          <Route path={router.Liver} element={<Liver/>} />
          <Route path={router.Kidney} element={<Kidney/>} />
          <Route path={router.Fiver} element={<Fiver/>} />
          <Route path={router.SexHealth} element={<SexHealth/>} />
          {/* Add more routes as needed */}

        </Route>

        {/* For routes without header/footer */}
        <Route path="*" element={<WithoutHeaderFotter />} />
        <Route path={router.notFound} element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
