# Admin Dashboard Frontend Requirements

## Overview
This document outlines the requirements and specifications for the admin dashboard frontend that will integrate with our homestay booking backend system.

## Backend API Base URL
```
http://localhost:5000/api
```

## Authentication

### Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
```typescript
{
  email?: string;    // Can use either email or username
  username?: string;
  password: string;
}
```
- **Response**:
```typescript
{
  status: 'success',
  data: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      name: string;
      role: 'homestay_owner' | 'super_admin' | 'activity_manager';
      is_active: boolean;
      last_login: Date | null;
      created_at: Date;
      updated_at: Date;
    }
  }
}
```

### Authentication Requirements
1. JWT token must be included in all API requests:
   ```
   Authorization: Bearer <token>
   ```
2. Implement token storage in secure HTTP-only cookies or secure local storage
3. Handle token expiration and refresh logic
4. Implement proper logout functionality
5. Handle 401 (Unauthorized) and 403 (Forbidden) responses

## Role-Based Access Control

### Admin Roles
1. **Super Admin**
   - Full access to all features
   - Can manage all homestays
   - Can manage all users
   - Can manage all bookings
   - Can manage system settings

2. **Homestay Owner**
   - Can manage their own homestays
   - Can manage rooms in their homestays
   - Can manage bookings for their homestays
   - Can view and respond to reviews
   - Can manage their profile

3. **Activity Manager**
   - Can manage activities
   - Can manage activity bookings
   - Can manage activity schedules
   - Can view related homestay information

## Core Features

### 1. Dashboard
- Overview statistics
- Recent bookings
- Pending actions
- Revenue metrics
- Occupancy rates
- Activity status

### 2. Homestay Management
- **Endpoints**:
  - `GET /api/homestays` - List homestays
  - `POST /api/homestays` - Create homestay
  - `GET /api/homestays/:id` - Get homestay details
  - `PUT /api/homestays/:id` - Update homestay
  - `DELETE /api/homestays/:id` - Delete homestay

- **Features**:
  - CRUD operations for homestays
  - Room management
  - Image upload and management
  - Pricing management
  - Availability calendar
  - Amenities management

### 3. Booking Management
- **Endpoints**:
  - `GET /api/bookings/:id` - Get booking details by ID
    ```typescript
    // Response
    {
      status: 'success',
      data: {
        id: number;
        start_date: string;
        end_date: string;
        room_id: number;
        status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
        is_paid: boolean;
        user_id: number | null;
        booking_number: string;
        total_price: number;
        payment_method: string | null;
        check_in_time: string | null;
        check_out_time: string | null;
        number_of_guests: number;
        notes: string | null;
        special_requests: string | null;
        room: {
          id: number;
          title: string;
          room_number: string;
        };
        homestay: {
          id: number;
          title: string;
        };
      }
    }
    ```
  
  - `GET /api/bookings/user/:userId` - Get all bookings for a specific user
    ```typescript
    // Response
    {
      status: 'success',
      data: [
        // Array of booking objects similar to the above
      ]
    }
    ```
  
  - `PUT /api/bookings/:id/status` - Update booking status
    ```typescript
    // Request body
    {
      status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    }
    
    // Response
    {
      status: 'success',
      data: {
        // Updated booking object
      }
    }
    ```
  
  - `GET /api/bookings/room/:roomId/availability` - Check room availability
    ```typescript
    // Query parameters
    ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    
    // Response
    {
      status: 'success',
      data: {
        available: boolean;
        conflicting_bookings?: [
          // Array of booking objects if not available
        ]
      }
    }
    ```
  
  - `POST /api/bookings` - Create a new booking (authenticated users)
    ```typescript
    // Request body
    {
      start_date: string;       // YYYY-MM-DD
      end_date: string;         // YYYY-MM-DD
      room_id: number;
      number_of_guests: number;
      special_requests?: string;
      notes?: string;
      check_in_time?: string;   // HH:MM
      check_out_time?: string;  // HH:MM
      payment_method?: string;
    }
    
    // Response
    {
      status: 'success',
      data: {
        // Created booking object with room and homestay details
      }
    }
    ```
  
  - `POST /api/bookings/guest` - Create a guest booking (no authentication required)
    ```typescript
    // Request body
    {
      start_date: string;       // YYYY-MM-DD
      end_date: string;         // YYYY-MM-DD
      room_id: number;
      number_of_guests: number;
      guest_name: string;
      guest_email: string;
      guest_phone: string;
      special_requests?: string;
      notes?: string;
      check_in_time?: string;   // HH:MM
      check_out_time?: string;  // HH:MM
      payment_method?: string;
    }
    
    // Response
    {
      status: 'success',
      data: {
        // Created booking object with room and homestay details
      }
    }
    ```

- **Features**:
  - View all bookings
  - Filter bookings by status
  - Update booking status
  - View booking details
  - Generate booking reports
  - Handle cancellations
  - Send booking confirmations
  - Email notification system for booking status changes
  - Support for guest bookings (non-registered users)
  - Room availability checking

### 4. User Management
- **Endpoints**:
  - `GET /api/users` - List users
  - `GET /api/users/:id` - Get user details
  - `PUT /api/users/:id` - Update user
  - `DELETE /api/users/:id` - Delete user

- **Features**:
  - View user profiles
  - Manage user permissions
  - View user booking history
  - Handle user support requests

### 5. Payment Management
- **Endpoints**:
  - `GET /api/payments` - List payments
  - `GET /api/payments/:id` - Get payment details
  - `PUT /api/payments/:id` - Update payment status

- **Features**:
  - View payment history
  - Track payment status
  - Generate payment reports
  - Handle refunds
  - Export payment data

### 6. Review Management
- **Endpoints**:
  - `GET /api/reviews` - List reviews
  - `GET /api/reviews/:id` - Get review details
  - `PUT /api/reviews/:id` - Update review status

- **Features**:
  - View and moderate reviews
  - Respond to reviews
  - Filter reviews by rating
  - Generate review reports

## UI/UX Requirements

### 1. Design System
- Modern, clean interface
- Responsive design for all screen sizes
- Consistent color scheme and typography
- Accessible design (WCAG 2.1 compliance)

### 2. Navigation
- Role-based menu items
- Breadcrumb navigation
- Quick access to common actions
- Search functionality

### 3. Data Display
- Tables with sorting and filtering
- Pagination for large datasets
- Data visualization (charts, graphs)
- Export functionality (CSV, PDF)

### 4. Forms
- Input validation
- Error handling
- Loading states
- Success/error notifications
- File upload capabilities

### 5. Notifications
- Real-time updates
- Email notifications
- In-app notifications
- Toast messages for actions

## Technical Requirements

### 1. State Management
- Implement proper state management (Redux/Context)
- Handle authentication state
- Manage user permissions
- Cache API responses
- Handle offline capabilities

### 2. Error Handling
- Global error boundary
- API error handling
- Form validation errors
- Network error handling
- User-friendly error messages

### 3. Performance
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- API request optimization

### 4. Security
- CSRF protection
- XSS prevention
- Secure password handling
- Input sanitization
- Rate limiting

### 5. Testing
- Unit tests
- Integration tests
- E2E tests
- Performance testing
- Accessibility testing

## Integration Requirements

### 1. Email System
- Integration with email templates
- Automated notifications
- Booking confirmations
- Password reset emails
- Marketing emails

### 2. Payment Gateway
- Secure payment processing
- Multiple payment methods
- Refund handling
- Payment status tracking
- Transaction history

### 3. File Storage
- Image upload and management
- Document storage
- File type validation
- Storage optimization
- CDN integration

### 4. Analytics
- User behavior tracking
- Booking analytics
- Revenue reports
- Occupancy reports
- Performance metrics

## Development Guidelines

### 1. Code Structure
```
src/
├── components/
│   ├── common/
│   ├── layout/
│   └── features/
├── pages/
├── services/
├── utils/
├── hooks/
├── context/
├── types/
└── assets/
```

### 2. Naming Conventions
- Components: PascalCase
- Files: kebab-case
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

### 3. Code Quality
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Code documentation
- Code review process

### 4. Git Workflow
- Feature branches
- Pull request reviews
- Semantic versioning
- Changelog maintenance
- Deployment process

## Deployment

### 1. Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
REACT_APP_GA_TRACKING_ID=your-ga-id
```

### 2. Build Process
- Production build optimization
- Asset compression
- Source maps generation
- Environment configuration
- Deployment scripts

### 3. Monitoring
- Error tracking
- Performance monitoring
- User analytics
- Server health checks
- Log management

## Support and Maintenance

### 1. Documentation
- API documentation
- Component documentation
- Setup instructions
- Deployment guide
- Troubleshooting guide

### 2. Maintenance
- Regular updates
- Security patches
- Performance optimization
- Bug fixes
- Feature enhancements

### 3. Support
- User support system
- Bug reporting
- Feature requests
- Documentation updates
- Training materials 