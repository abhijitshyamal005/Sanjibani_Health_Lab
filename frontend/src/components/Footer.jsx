/* eslint-disable react/no-unescaped-entities */
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa6';
import apple from '../assets/app-store-button.webp';
import play from '../assets/google-play-button.webp';
// import { NavLink } from 'react-router-dom'

const Footer = () => {
    return (
        <div className='bg-gray-50 pl-10 pr-10'>
            {/* Q&A Section */}
            <section className="text-gray-700 py-10">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-semibold mb-3">SanjiBani Health Labs: Who Are We</h2>
                    <p className='text-sm text-gray-600 mb-5'>
                        Welcome to SanjiBani Health Labs! Experience the convenience of a high-quality diagnostic laboratory, within the comfort of your home. We provide laboratory services that bring cutting-edge diagnostics right to your doorstep, ensuring you have easy access to essential healthcare solutions. We are your trusted partners, backed by certifications, ensuring top-notch accuracy and quality. With a track record of exceeding 1,000,000 tests, our credibility is trusted by healthcare professionals. So, get ready to embrace the luxury of premium diagnostics without stepping out of the comfort of your home – because your well-being deserves nothing but the best
                    </p>
                    <h2 className="text-2xl font-semibold mb-3">Steps to Book a Test/ Health Package</h2>
                    <p className='text-sm text-gray-600 mb-5'>
                        Say goodbye to long queues and hello to hassle-free blood sample collection from our pathology lab right at your doorstep. Here's a straightforward step-by-step guide:
                        <ul className="list-disc ml-5 mt-3 text-gray-600">
                            <li>Visit www.orangehealth.in or use the SanjiBani Health Lab Test At Home app.</li>
                            <li>Provide your details through the platform.</li>
                            <li>Skilled, trained, and vaccinated eMedics will reach you within 60 minutes or as per your chosen time slot.</li>
                            <li>Collected samples will be sent straight to our accredited pathology laboratory for testing.</li>
                            <li>Expect your test reports via WhatsApp & Email within 6 hours, based on the tests done.</li>
                            <li>You can also conveniently access your reports on our app for easy reference.</li>
                        </ul>
                    </p>
                    <h2 className="text-2xl font-semibold mb-5">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {/* Q&A Item */}
                        <div>
                            <h3 className="font-semibold text-base"><span className='font-thin'>Q1:</span> Why should you choose Sanjibani Health Labs over other pathology labs?</h3>
                            <p className='mt-3 text-sm text-gray-600'>Sanjibani Health Labs stands out as the fastest diagnostic lab in town. From rapid at-home testing to expert eMedics, we blend cutting-edge diagnostics with comfort. With lab approval, we’re your trusted path to accurate results. Experience health on your terms!</p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-base"><span className='font-thin'>Q2:</span> How does home collection within 60 minutes work?</h3>
                            <p className='mt-3 text-sm text-gray-600'>We guarantee sample collections within just 60 minutes from order placement in Bangalore, Delhi, Gurugram, Noida, Hyderabad, Faridabad, and Mumbai. Our skilled, vaccinated eMedics, following your chosen schedule, will arrive at your door. Your sample will be carefully handled, maintained at the right temperature, and transported to our lab with accreditation. The results will reach you even with greater speed!</p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-base"><span className='font-thin'>Q3:</span> How are reports delivered?</h3>
                            <p className='mt-3 text-sm text-gray-600'>You will receive your reports via WhatsApp within 6 hours for most tests with our diagnostic laboratory. Additionally, you can access and view the reports on our app at any time.</p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-base"><span className='font-thin'>Q4:</span> What are the modes of payment available for booking?</h3>
                            <p className='mt-3 text-sm text-gray-600'>We offer a range of convenient payment options for our home pathology services. These include UPI, Mastercard, Visa card, Debit cards, and Credit card options. The choice is yours!</p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-base"><span className='font-thin'>Q5:</span> Can I cancel a test booking?</h3>
                            <p className='mt-3 text-sm text-gray-600'>For any queries about canceling a test booking, just chat with us via WhatsApp at 6296390743. We’re here to help, and we’ll get back to you in a flash!</p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-base"><span className='font-thin'>Q6:</span> Can I reschedule a booked test?</h3>
                            <p className='mt-3 text-sm text-gray-600'>If the need to reschedule a booked test arises or if you’re seeking answers on our diagnostic lab services, simply chat with us via WhatsApp at 6296390743. Our team is primed to swiftly address your queries and provide the support you seek.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Section 1 */}
            <footer className="py-7 border-t-2">
                <div className="container mx-auto">
                    <h1 className="font-bold text-gray-700 text-xl mb-4">Blood Tests Price</h1>
                    {/* Upper Section in one row */}
                    <div className="flex flex-wrap text-sm text-gray-700 justify-between gap-8">
                        {/* Company Section */}
                        {['Dengue Test price', 'Dengue NS1 Antigen Test price', 'Lipid Profile Test price', 'Vitamin D Test price', 'Vitamin B12 Test price', 'Thyroid Function Test price'].map((item, index) => (
                            <div key={index} className="w-full sm:w-1/6 mb-6">
                                <ul className="space-y-4">
                                    <li><a href="#" className="hover:text-orange-500">{item}</a></li>
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </footer>

            {/* Footer Section 2 */}
            <footer className="py-7 border-t-2">
                <div className="container mx-auto">
                    <h1 className="font-bold text-gray-700 text-xl mb-4">Popular Tests</h1>
                    {/* Upper Section in one row */}
                    <div className="flex flex-wrap text-sm text-gray-700 justify-between gap-8">
                        {/* Popular Tests Section */}
                        {['BUN Test', 'Amh test', 'CBC test', 'Chlamydia Test', 'Cholesterol test', 'Creatinine test'].map((item, index) => (
                            <div key={index} className="w-full sm:w-1/6 mb-6">
                                <ul className="space-y-4">
                                    <li><a href="#" className="hover:text-orange-500">{item}</a></li>
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </footer>

            {/* Footer Section 3 */}
            <footer className="py-7 border-t-2">
                <div className="container mx-auto px-4">
                    {/* Upper Section in one row */}
                    <div className="flex flex-wrap justify-between items-start mb-8">
                        <div className="w-full sm:w-1/4 mb-6 sm:mb-0">
                            <div className="flex items-center">
                                <div className="text-orange-400 text-3xl font-bold">SanjiBani</div>
                                <div className="text-green-600 font-semibold text-3xl"> Health<span className="text-orange-400 ml-[-2px]"> Labs</span></div>
                            </div>
                            <div className="flex space-x-4 mt-6">
                                <a href="#"><FaInstagram className='h-10 w-10 bg-white rounded-lg shadow-xl p-2' /></a>
                                <a href="#"><FaFacebook className='h-10 w-10 bg-white rounded-lg shadow-xl p-2' /></a>
                                <a href="#"><FaLinkedin className='h-10 w-10 bg-white rounded-lg shadow-xl p-2' /></a>
                                <a href="#"><FaTwitter className='h-10 w-10 bg-white rounded-lg shadow-xl p-2' /></a>
                            </div>
                        </div>

                        <div className="w-full sm:w-1/2 mb-6 sm:mb-0">
                            <div className="flex justify-around mb-6">
                                <div className="text-gray-800 font-bold">Get our App</div>
                                <div className="flex space-x-4">
                                    <a href="#"><img src={play} alt="Google Play Store" className="w-32" /></a>
                                    <a href="#"><img src={apple} alt="App Store" className="w-32" /></a>
                                </div>
                            </div>

                        </div>
                        <div className="w-full sm:w-1/4">
                            <div className="text-gray-800 font-bold mb-3">Contact Us</div>
                            <ul className="space-y-4 text-gray-600 text-sm">
                                <li><a href="mailto:support@sanjiBani.com">support@sanjiBani.com</a></li>
                                <li><a href="tel:+1234567890">+123-456-7890</a></li>
                                <li>123 SanjiBani Street, Health City</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
            <div className="text-gray-700 items-center justify-center flex ">
                <p>&copy; 2025 SanjiBani Health Labs. All rights reserved.</p>
            </div>
        </div>
    );
};

export default Footer;
