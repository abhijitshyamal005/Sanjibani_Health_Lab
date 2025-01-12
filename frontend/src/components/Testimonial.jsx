import { useState } from 'react';

const testimonialsData = [
  {
    name: "Pragya Raj Gupta",
    position: "Kolkata",
    imageSrc: "https://via.placeholder.com/150", // Replace with actual image URL
    review: "It was as if my job was already done the minute I chose Sanjibani Health for my blood tests. Very professional and smooth!"
  },
  {
    name: "Rashmi Nair",
    position: "Digha",
    imageSrc: "https://via.placeholder.com/150", // Replace with actual image URL
    review: "Everything about Sanjibani Health, right from punctual collection of samples from home to the timely delivery of reports is absolutely worth the money."
  },
  {
    name: "Rajnath Biswas",
    position: "Egra",
    imageSrc: "https://via.placeholder.com/150", // Replace with actual image URL
    review: "Very seamless and convenient, can't recommend it enough!"
  },
  {
    name: "Priya Singh",
    position: "Asansol",
    imageSrc: "https://via.placeholder.com/150", // Replace with actual image URL
    review: "The service was top-notch and timely. I was impressed with the attention to detail and efficiency."
  },
  {
    name: "Amit Sharma",
    position: "Medinipur",
    imageSrc: "https://via.placeholder.com/150", // Replace with actual image URL
    review: "I had a fantastic experience with Sanjibani Health. The process was fast and accurate."
  },
  {
    name: "Neha Verma",
    position: "Contai",
    imageSrc: "https://via.placeholder.com/150", // Replace with actual image URL
    review: "Sanjibani Health provides a reliable service. Their home sample collection is a life-saver."
  },
  {
    name: "Ravi Kumar",
    position: "Purulia",
    imageSrc: "https://via.placeholder.com/150", // Replace with actual image URL
    review: "Great experience with Sanjibani Health. The staff was friendly and the service was super convenient."
  },
  {
    name: "Megha Sinha",
    position: "Siliguri",
    imageSrc: "https://via.placeholder.com/150", // Replace with actual image URL
    review: "I was hesitant at first, but Sanjibani Health made everything so easy. Fast and reliable service!"
  }
];

const Testimonial = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const testimonialsPerPage = 4; // Number of testimonials to show per page

  const totalPages = Math.ceil(testimonialsData.length / testimonialsPerPage);

  const handleNext = () => {
    setCurrentPage((prevPage) => (prevPage + 1) % totalPages);
  };

  const handlePrevious = () => {
    setCurrentPage((prevPage) => (prevPage - 1 + totalPages) % totalPages);
  };

  const startIndex = currentPage * testimonialsPerPage;
  const displayedTestimonials = testimonialsData.slice(startIndex, startIndex + testimonialsPerPage);

  return (
    <div className="py-8 px-4">
      <div className="flex flex-col items-center max-w-4xl mx-auto">
        <div className="text-center mb-16 max-w-lg">
          <h2 className="text-4xl font-bold md:text-5xl">What people say about us</h2>
          <p className="text-sm md:text-base mt-2">
            These are concise and effective. They capture a customer’s experience in their own words. Here are a few examples..
          </p>
        </div>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {displayedTestimonials.map((testimonial, index) => (
            <div key={index} className="bg-white shadow-md p-4 rounded-lg border-t-2 border-green-500">
              <div className="flex items-center gap-4">
                <img
                  alt={`Image of ${testimonial.name}`}
                  src={testimonial.imageSrc}
                  className="w-16 h-16 object-cover rounded-full"
                />
                <div className="flex flex-col justify-center">
                  <strong className="text-lg md:text-xl">{testimonial.name}</strong>
                  <span className="text-sm md:text-base">{testimonial.position}</span>
                </div>
              </div>
              <p className="mt-4 text-left text-sm md:text-base">{testimonial.review}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            className={`p-3 rounded-full bg-gradient-to-l from-[#ff970a] to-[#ffd59d] border-2 text-white hover:bg-[#983909] flex items-center justify-center ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={currentPage === 0}
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className={`p-3 rounded-full bg-gradient-to-r from-[#ba7515] to-[#ffd59d] border-[#D15213] text-white hover:bg-[#a9410d] flex items-center justify-center ${currentPage === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
