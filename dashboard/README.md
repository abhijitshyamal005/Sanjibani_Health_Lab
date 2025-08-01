# Sanjibani Health Lab - Admin Dashboard

A comprehensive admin dashboard for managing patient records, orders, and laboratory operations for Sanjibani Health Lab.

## Features

### 🔐 Authentication
- Secure admin login system
- Session management
- Protected routes

### 📊 Dashboard Overview
- Real-time statistics and metrics
- Revenue tracking
- Patient and order counts
- Growth indicators
- Interactive charts and graphs

### 👥 Patient Management
- View all patient records
- Add new patients
- Edit patient information
- Search and filter patients
- Patient history tracking
- Contact information management

### 📋 Order Management
- Track all laboratory orders
- Update order status (Pending, In Progress, Completed, Cancelled)
- View order details
- Payment status tracking
- Order history
- Download reports

### 📈 Analytics
- Revenue trends and analysis
- Order statistics
- Patient demographics
- Test type distribution
- Performance metrics
- Growth analysis

### ⚙️ Settings
- Profile management
- Notification preferences
- Security settings
- Appearance customization
- System configuration

## Technology Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router DOM
- **State Management**: React Context API

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the dashboard directory:
```bash
cd dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Demo Credentials
- **Username**: admin
- **Password**: admin123

## Project Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx          # Main dashboard layout
│   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   └── Login.jsx              # Login component
│   ├── pages/
│   │   ├── Overview.jsx           # Dashboard overview
│   │   ├── Patients.jsx           # Patient management
│   │   ├── Orders.jsx             # Order management
│   │   ├── Analytics.jsx          # Analytics and reports
│   │   └── Settings.jsx           # Settings and configuration
│   ├── context/
│   │   └── AuthContext.jsx        # Authentication context
│   ├── App.jsx                    # Main app component
│   ├── App.css                    # Custom styles
│   └── main.jsx                   # App entry point
├── package.json
└── README.md
```

## Key Features Explained

### Patient Management
- **View Patients**: Browse all registered patients with search and filter capabilities
- **Add Patient**: Create new patient records with comprehensive information
- **Edit Patient**: Update patient details including contact information and medical history
- **Patient Analytics**: View patient statistics and demographics

### Order Management
- **Order Tracking**: Monitor the status of all laboratory orders
- **Status Updates**: Change order status from Pending to Completed
- **Payment Tracking**: Monitor payment status and methods
- **Order Details**: View comprehensive order information including test details

### Analytics Dashboard
- **Revenue Analysis**: Track revenue trends and growth
- **Order Statistics**: Monitor order volumes and patterns
- **Patient Demographics**: Analyze patient age groups and gender distribution
- **Test Performance**: Identify top-performing tests and services

### Settings & Configuration
- **Profile Settings**: Manage admin profile information
- **Notification Preferences**: Configure email and SMS notifications
- **Security Settings**: Set up two-factor authentication and session timeouts
- **Appearance**: Customize theme, language, and display preferences

## API Integration

The dashboard is designed to work with the existing backend API. Key endpoints include:

- **Authentication**: `/api/auth/login`
- **Patients**: `/api/patients`
- **Orders**: `/api/orders`
- **Analytics**: `/api/analytics`

## Responsive Design

The dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Security Features

- Protected routes requiring authentication
- Session management
- Input validation
- XSS protection
- CSRF protection

## Customization

### Themes
The dashboard supports multiple themes:
- Light theme (default)
- Dark theme
- Auto theme (follows system preference)

### Languages
Support for multiple languages:
- English
- Hindi
- Bengali

### Currency
Multiple currency support:
- Indian Rupee (₹)
- US Dollar ($)
- Euro (€)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project follows React best practices:
- Functional components with hooks
- Proper prop validation
- Clean and readable code
- Consistent naming conventions

## Deployment

### Build for Production

1. Build the project:
```bash
npm run build
```

2. The built files will be in the `dist` directory

3. Deploy the contents of the `dist` directory to your web server

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Sanjibani Health Lab
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions:
- Email: support@sanjibanilab.com
- Phone: +91 9876543210

## License

This project is proprietary software for Sanjibani Health Lab.

## Version History

- **v2.1.0** - Current version with full admin dashboard
- **v2.0.0** - Initial dashboard implementation
- **v1.0.0** - Basic admin panel
