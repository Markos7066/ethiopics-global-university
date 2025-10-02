# Language Teaching Center Backend API

A comprehensive backend system for a language teaching center with role-based authentication, booking management, payment processing, and admin controls.

## Features

### User Management
- **Three User Roles**: Student, Teacher, Admin
- **Separate Profile Models**: Dedicated profile models for each role
- **Teacher Approval System**: Admin approval required for teachers
- **File Upload Requirements**: Teachers must upload CV (PDF) and photo during registration

### Core Functionality
- **Booking System**: Students can book teachers with confirmation workflow
- **Payment Processing**: Integrated payment system with transaction tracking
- **Review System**: Students can review teachers after completed bookings
- **Complaint System**: Students can file complaints about specific bookings
- **Notification System**: Real-time notifications for all users
- **Auto-Expiration**: Bookings automatically expire after one month

### Admin Features
- **Dashboard**: Comprehensive statistics and overview
- **Teacher Management**: View CVs, photos, approve/reject teachers
- **Student Management**: Full CRUD operations on student accounts
- **Booking Management**: Monitor and manage all bookings
- **Complaint Resolution**: Handle and resolve student complaints
- **System Analytics**: Revenue tracking and user statistics

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Upload**: Multer for CV and photo handling
- **Email**: Nodemailer for notifications
- **Validation**: Express-validator for input validation
- **Scheduling**: Node-cron for automated tasks

## Project Structure

\`\`\`
├── config/
│   ├── database.js          # MongoDB connection
│   └── config.js            # Environment configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── adminController.js   # Admin management
│   ├── userController.js    # User operations
│   ├── bookingController.js # Booking management
│   ├── paymentController.js # Payment processing
│   ├── complaintController.js # Complaint handling
│   └── reviewController.js  # Review system
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── roleAuth.js         # Role-based authorization
│   └── upload.js           # File upload handling
├── models/
│   ├── User.js             # Common user data
│   ├── TeacherProfile.js   # Teacher-specific data
│   ├── StudentProfile.js   # Student-specific data
│   ├── AdminProfile.js     # Admin-specific data
│   ├── Booking.js          # Booking information
│   ├── Payment.js          # Payment records
│   ├── Complaint.js        # Complaint system
│   ├── Review.js           # Review system
│   └── Notification.js     # Notification system
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── admin.js            # Admin routes
│   ├── users.js            # User routes
│   ├── bookings.js         # Booking routes
│   ├── payments.js         # Payment routes
│   ├── complaints.js       # Complaint routes
│   ├── reviews.js          # Review routes
│   └── notifications.js    # Notification routes
├── utils/
│   ├── emailService.js     # Email utilities
│   ├── notificationService.js # Notification utilities
│   ├── scheduledTasks.js   # Automated tasks
│   └── emailTemplates.js  # Email templates
└── uploads/
    ├── cvs/               # Teacher CV files
    ├── photos/            # Teacher photos
    └── complaints/        # Complaint attachments
\`\`\`

## Installation

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd language-teaching-center
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Environment Setup**
Create a `.env` file with the following variables:
\`\`\`env
# Database
MONGODB_URI=mongodb://localhost:27017/language-teaching-center

# Server
PORT=5000

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
\`\`\`

4. **Start the server**
\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (with file upload for teachers)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password

### Admin Management
- `GET /api/admin/dashboard` - Admin dashboard statistics
- `GET /api/admin/teachers` - List all teachers (with CV/photo access)
- `GET /api/admin/teachers/:id` - Get teacher details with CV and photo
- `PUT /api/admin/teachers/:id/approve` - Approve teacher
- `PUT /api/admin/teachers/:id/reject` - Reject teacher
- `GET /api/admin/students` - List all students
- `GET /api/admin/complaints` - List all complaints
- `PUT /api/admin/complaints/:id/status` - Update complaint status

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id/confirm` - Teacher confirms booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/:id` - Get booking details

### Reviews
- `POST /api/reviews` - Create review (students only)
- `GET /api/reviews/teacher/:teacherId` - Get teacher reviews
- `PUT /api/reviews/:id` - Update review
- `POST /api/reviews/:id/response` - Teacher response to review

### Complaints
- `POST /api/complaints` - File complaint (with file attachment)
- `GET /api/complaints` - Get user complaints
- `PUT /api/complaints/:id` - Update complaint
- `POST /api/complaints/:id/message` - Add message to complaint

### Payments
- `POST /api/payments` - Process payment
- `GET /api/payments` - Get payment history
- `GET /api/payments/:id` - Get payment details

## File Upload Requirements

### Teacher Registration
- **CV**: Required PDF file (max 5MB)
- **Photo**: Required image file (JPG, PNG, GIF - max 5MB)
- Files are stored in `/uploads/cvs/` and `/uploads/photos/`
- Admin can view these files before approving teachers

### Complaint Attachments
- Optional file attachment for complaints
- Supports images, PDFs, and documents
- Stored in `/uploads/complaints/`

## User Roles & Permissions

### Student
- Register and manage profile
- Book teachers and make payments
- Leave reviews after completed bookings
- File complaints about bookings
- Receive notifications

### Teacher
- Register with CV and photo (requires admin approval)
- Manage availability and rates
- Confirm/reject booking requests
- Respond to student reviews
- View earnings and statistics

### Admin
- View dashboard with system statistics
- Approve/reject teacher applications (with CV/photo review)
- Manage all users (CRUD operations)
- Handle complaint resolution
- Monitor all bookings and payments
- System-wide notifications

## Automated Features

### Scheduled Tasks
- **Booking Expiration**: Automatically expire bookings after 30 days
- **Reminder Emails**: Send booking reminders to students and teachers
- **Cleanup Tasks**: Remove expired tokens and old notifications

### Email Notifications
- Welcome emails for new users
- Teacher approval/rejection notifications
- Booking confirmations and reminders
- Payment confirmations
- Complaint status updates

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-based Authorization**: Middleware for role checking
- **Input Validation**: Express-validator for all inputs
- **File Upload Security**: Type and size restrictions
- **CORS Protection**: Configured for frontend integration

## Database Schema

### User Model (Common Data)
- name, email, phone, password, role
- Timestamps and authentication fields

### Profile Models (Role-Specific)
- **TeacherProfile**: CV, photo, languages, rates, availability
- **StudentProfile**: Learning preferences, enrollment history
- **AdminProfile**: Permissions and department info

### Booking Model
- Student, teacher, date, price, status
- Auto-expiration after 30 days
- Payment integration

### Review Model
- Rating, comment, teacher response
- Linked to completed bookings

### Complaint Model
- Subject, description, priority, status
- File attachments support
- Admin resolution tracking

## Development

### Running in Development
\`\`\`bash
npm run dev
\`\`\`

### Testing File Uploads
Use tools like Postman or curl to test file uploads:
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/register \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "password=password123" \
  -F "role=teacher" \
  -F "cv=@path/to/cv.pdf" \
  -F "photo=@path/to/photo.jpg" \
  -F "description=Experienced teacher" \
  -F "languages=[\"English\", \"Spanish\"]"
\`\`\`

## Production Deployment

1. Set production environment variables
2. Configure MongoDB connection
3. Set up email service (Gmail, SendGrid, etc.)
4. Configure file storage (local or cloud)
5. Set up SSL certificates
6. Configure reverse proxy (nginx)

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with proper validation
4. Test file upload functionality
5. Submit pull request

## License

MIT License - see LICENSE file for details
