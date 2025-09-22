# GreenCart Logistics Management System

A comprehensive delivery management system built with Next.js, featuring automated order assignment, driver management, and real-time tracking capabilities.

## 🚀 Live Demo

**Live Application**: [https://your-app-url.vercel.app](https://your-app-url.vercel.app)
**GitHub Repository**: [https://github.com/your-username/greencart-logistics](https://github.com/your-username/greencart-logistics)

## 📋 Features

### Core Functionality
- **Order Management**: Create, view, and manage delivery orders
- **Driver Management**: Add drivers and track their workload and schedules
- **Automated Assignment**: Intelligent order-to-driver assignment based on capacity
- **Manual Assignment**: Override automatic assignments with manual selection
- **Real-time Dashboard**: Live statistics and system overview
- **Weekly Hours Tracking**: Detailed driver schedule analysis with visual charts

### Key Capabilities
- ✅ **Manual Order Creation** - Add new orders with customer details
- ✅ **Manual Driver Assignment** - Assign specific drivers to orders
- ✅ **Driver Creation** - Add new drivers with shift schedules
- ✅ **Weekly Hours Analysis** - Comprehensive driver workload breakdown
- ✅ **Real-time Updates** - Live data synchronization
- ✅ **Responsive Design** - Mobile and desktop compatible

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.5.3, React, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Deployment**: Vercel (recommended)
- **Development**: Node.js, npm

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/greencart_logistics"

# Next.js Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: For production deployment
VERCEL_URL="your-vercel-url"
```

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/greencart-logistics.git
   cd greencart-logistics
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Seed the database with sample data
   npm run seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - The application will be running with sample data

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

3. **Database Setup**
   - Use Vercel Postgres or external PostgreSQL provider
   - Update `DATABASE_URL` in Vercel environment variables

### Manual Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

## 📖 Usage Guide

### Dashboard Overview
- View system statistics and quick actions
- Monitor total orders, pending assignments, and delivery metrics
- Access quick navigation to all system sections

### Order Management
1. **View Orders**: Navigate to `/orders` to see all orders
2. **Create Order**: Click "Create Order" button and fill in details
3. **Manual Assignment**: Click "Assign" on unassigned orders to select drivers
4. **Auto Assignment**: Use "Auto Assign All" for bulk assignment

### Driver Management
1. **View Drivers**: Navigate to `/drivers` to see all drivers
2. **Add Driver**: Click "Add Driver" and enter driver information
3. **Weekly Hours**: Click "View Details" to see comprehensive schedule breakdown
4. **Workload Tracking**: Monitor driver capacity and assignments

### Assignment Management
- View all current assignments at `/assignments`
- Track assignment status and delivery progress
- Monitor driver workload distribution

## 🔧 API Endpoints

### Orders
- `GET /api/orders` - Fetch all orders
- `POST /api/orders` - Create new order

### Drivers
- `GET /api/drivers` - Fetch all drivers
- `POST /api/drivers` - Create new driver

### Assignments
- `GET /api/assignments` - Fetch all assignments
- `POST /api/assignments` - Auto-assign orders
- `POST /api/assignments/manual` - Manual assignment

### System
- `GET /api/health` - Health check
- `POST /api/seed` - Seed database with sample data
- `GET /api/dashboard/stats` - Dashboard statistics

## 📊 Database Schema

### Core Tables
- **Orders**: Order details, values, delivery times
- **Drivers**: Driver information, shift hours, past week data
- **Routes**: Route information with distance and traffic data
- **Assignments**: Order-driver assignments with timestamps

## 🎨 UI Components

### Modals
- **CreateOrderModal**: Order creation form
- **ManualAssignmentModal**: Driver selection for orders
- **CreateDriverModal**: Driver registration form
- **WeeklyHoursModal**: Detailed driver schedule analysis

### Tables
- **OrdersTable**: Order listing with assignment actions
- **DriversTable**: Driver management with schedule viewing
- **AssignmentsTable**: Assignment tracking and status

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify `DATABASE_URL` in `.env` file
   - Ensure PostgreSQL is running
   - Check database credentials

2. **Build Errors**
   - Run `npm install` to ensure all dependencies
   - Clear `.next` folder and rebuild
   - Check Node.js version compatibility

3. **Seeding Issues**
   - Ensure CSV files exist in `/files` directory
   - Verify database schema is up to date
   - Check file permissions

### Performance Optimization
- Use `npm run build` for production builds
- Enable database connection pooling
- Implement caching for frequently accessed data

## 📝 Development

### Project Structure
```
├── app/
│   ├── api/              # API routes
│   ├── components/       # React components
│   ├── (pages)/         # Next.js pages
│   └── globals.css      # Global styles
├── lib/                 # Utility functions
├── prisma/             # Database schema
├── files/              # CSV data files
└── public/             # Static assets
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with sample data

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ using Next.js and modern web technologies**