import { useState } from "react";
import img1 from "../assets/testimonial/img1.jpg";
import img2 from "../assets/testimonial/img2.jpg";
import img3 from "../assets/testimonial/img3.jpg";
import img4 from "../assets/testimonial/img4.jpg";
import la from "../assets/testimonial/la.jpg";
import w1 from "../assets/testimonial/w1.jpg";
import w2 from "../assets/testimonial/w2.jpg";

const testimonialsData = [
  { name: "Pragya Raj Gupta", position: "Kolkata", imageKey: img1, review: "It was as if my job was already done the minute I chose Sanjibani Health for my blood tests. Very professional and smooth!" },
  { name: "Rashmi Nair", position: "Digha", imageKey: w2, review: "Everything about Sanjibani Health, right from punctual collection of samples from home to the timely delivery of reports, is absolutely worth the money." },
  { name: "Rajnath Biswas", position: "Egra", imageKey: img3, review: "Very seamless and convenient, can't recommend it enough!" },
  { name: "Labani Sahoo", position: "Belda", imageKey: la, review: "The service was top-notch and timely. I was impressed with the attention to detail and efficiency." },
  { name: "Amit Sharma", position: "Medinipur", imageKey: img2, review: "I had a fantastic experience with Sanjibani Health. The process was fast and accurate." },
  { name: "Neha Verma", position: "Contai", imageKey: w1, review: "Sanjibani Health provides a reliable service. Their home sample collection is a life-saver." },
  { name: "Ravi Kumar", position: "Purulia", imageKey: img4, review: "Great experience with Sanjibani Health. The staff was friendly and the service was super convenient." },
  { name: "Megha Sinha", position: "Siliguri", imageKey: img1, review: "I was hesitant at first, but Sanjibani Health made everything so easy. Fast and reliable service!" },
];

const Testimonial = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const testimonialsPerPage = 4;
  const totalPages = Math.ceil(testimonialsData.length / testimonialsPerPage);

  const handleNext = () => setCurrentPage((prev) => (prev + 1) % totalPages);
  const handlePrevious = () => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);

  const startIndex = currentPage * testimonialsPerPage;
  const displayedTestimonials = testimonialsData.slice(startIndex, startIndex + testimonialsPerPage);

  return (
    <div className="py-8 px-4">
      <div className="flex flex-col items-center max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-lg">
          <h2 className="text-4xl font-bold md:text-5xl">What people say about us</h2>
          <p className="text-sm md:text-base mt-2">
            These are concise and effective. They capture a customer’s experience in their own words. Here are a few examples..
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          {displayedTestimonials.map((testimonial, index) => (
            <div key={index} className="bg-white shadow-md p-4 rounded-lg border-t-2 border-green-500">
              <div className="flex items-center gap-4">
                <img
                  alt={`Image of ${testimonial.name}`}
                  src={testimonial.imageKey}
                  className="w-16 h-16 object-cover rounded-full"
                />
                <div>
                  <strong className="text-lg md:text-xl">{testimonial.name}</strong>
                  <span className="block text-sm md:text-base text-gray-600">{testimonial.position}</span>
                </div>
              </div>
              <p className="mt-4 text-left text-sm md:text-base">{testimonial.review}</p>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            className={`p-3 rounded-full bg-gradient-to-l from-[#ff970a] to-[#ffd59d] border-2 text-white hover:bg-[#983909] flex items-center justify-center ${
              currentPage === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={currentPage === 0}
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className={`p-3 rounded-full bg-gradient-to-r from-[#ba7515] to-[#ffd59d] border-[#D15213] text-white hover:bg-[#a9410d] flex items-center justify-center ${
              currentPage === totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={currentPage === totalPages - 1}
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
