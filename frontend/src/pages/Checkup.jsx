import Hero from "../components/Checkup/Hero"
import CarouselComponent from "../components/CarouselComponent"
import Checkups from "../components/Checkups";

import Fever from "../components/LabTest/Fever"

import BodyPart from "../components/LabTest/BodyPart"
import InfoCard from "../components/InfoCard"

const Checkup = () => {
  return (
    <>
    <Hero />
    <CarouselComponent />
    <Fever/>
    <Checkups/>
    <BodyPart/>
    <InfoCard/>

    </>
  )
}

export default Checkup