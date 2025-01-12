import Hero from "../components/Hero";
import CarouselComponent from "../components/CarouselComponent";
import Checkups from "../components/Checkups";
import Slider1 from "../components/Slider1";
import InfoCard from "../components/InfoCard";
import PhotoSlider from "../components/PhotoSlider";
import BodyOrgans from "../components/BodyOrgans";
import WhatsappImg from "../components/WhatsappImg";
import Testimonial from "../components/Testimonial";
import LastImgSec from "../components/LastImgSec";

const Home = () => {
  return (
    <>
      <Hero />
      <CarouselComponent />
      <Checkups />
      <Slider1 />
      <InfoCard />
      <PhotoSlider />
      <BodyOrgans />
      <WhatsappImg />
      <Testimonial />
      <LastImgSec />      
    </>
  );
};

export default Home;
