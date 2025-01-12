/* eslint-disable react/jsx-no-undef */
const LocationTable = () => {
  const locations = [
    { left: 'Kolkata', right: 'Howrah' },
    { left: 'Asansol', right: 'Durgapur' },
    { left: 'Siliguri', right: 'Jalpaiguri' },
    { left: 'Darjeeling', right: 'Kalimpong' },
    { left: 'Bardhaman', right: 'Birbhum' },
    { left: 'Cooch Behar', right: 'Alipurduar' },
    { left: 'Malda', right: 'Murshidabad' },
    { left: 'Hooghly', right: 'Nadia' },
    { left: 'North 24 Parganas', right: 'South 24 Parganas' },
    { left: 'Bankura', right: 'Purulia' },
    { left: 'Medinipur', right: 'Haldia' },
    { left: 'Kharagpur', right: 'Contai' },
    { left: 'Raiganj', right: 'Balurghat' },
    { left: 'Suri', right: 'Bolpur' },
    { left: 'Chandannagar', right: 'Kalyani' },
    { left: 'Bongaon', right: 'Barasat' },
    { left: 'Kakdwip', right: 'Basirhat' },
    { left: 'Tamluk', right: 'Uluberia' },
    { left: 'Arambagh', right: 'Ghatal' },
    { left: 'Katwa', right: 'Baharampur' },
    { left: 'Haringhata', right: 'Ranaghat' },
    { left: 'Rampurhat', right: 'Tarapith' },
    { left: 'Kalna', right: 'Diamond Harbour' },
    { left: 'Bishnupur', right: 'Joypur' },
    { left: 'Habra', right: 'Bagda' },
    { left: 'Krishnanagar', right: 'Bhatpara' },
    { left: 'Jhargram', right: 'Belda' },
    { left: 'Mayapur', right: 'Tarakeswar' },
  ];

  return (
    <div className="container mx-auto mt-10 px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">
        SanjiBani Health Labs provides the fastest Essential Full Body Checkup
        services across West Bengal
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {locations.flatMap((location, index) => (
          <React.Fragment key={index}>
            <div className="border rounded-lg text-center p-4 hover:text-green-500 hover:border-green-500">
              {location.left}
            </div>
            <div className="border rounded-lg text-center p-4 hover:text-green-500 hover:border-green-500">
              {location.right}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default LocationTable;
