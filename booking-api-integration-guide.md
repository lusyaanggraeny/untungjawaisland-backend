# Booking Nexus API Integration Guide

## API Base URL and Structure
- **Base URL**: `http://localhost:5000/api`
- **API Structure**: Yes, the API uses the `/api` prefix for all endpoints
- **Development Port**: The API runs on port 5000 in development

## Authentication Requirements
- **Token Format**: JWT Bearer token in Authorization header
  ```
  Authorization: Bearer <your_jwt_token>
  ```
- **Admin Permissions**: Different admin roles have different access levels:
  - `super_admin`: Access to all bookings
  - `homestay_owner`: Access to bookings for their own homestays
  - `activity_manager`: Limited booking access

## Booking Endpoints Documentation

### 1. Retrieve Bookings
The backend currently does not have a dedicated endpoint for retrieving all bookings at the admin level. Based on your requirements, we should implement the following:

**Current Available Endpoints:**
- **Get Bookings by User ID**:
  - `GET /api/bookings/user/:userId`
  - Params: userId (path parameter)
  - Auth: Required
  - Description: Returns bookings for a specific user

- **Get Booking by ID**:
  - `GET /api/bookings/:id`
  - Params: id (path parameter)
  - Auth: Required
  - Description: Returns detailed information for a single booking

### 2. Update Booking Status
- **Update Booking Status**:
  - `PUT /api/bookings/:id/status`
  - Params: id (path parameter)
  - Body: 
    ```json
    {
      "status": "pending" | "confirmed" | "cancelled" | "completed"
    }
    ```
  - Auth: Required
  - Description: Updates the status of a booking

### 3. Check Room Availability
- **Check Room Availability**:
  - `GET /api/bookings/room/:roomId/availability`
  - Params: roomId (path parameter), start_date (query), end_date (query)
  - Example: `/api/bookings/room/5/availability?start_date=2023-06-01&end_date=2023-06-05`
  - Auth: Not required
  - Description: Checks if a room is available for the given date range

### 4. Create Bookings
- **Create Authenticated User Booking**:
  - `POST /api/bookings`
  - Body: Booking details (see sample below)
  - Auth: Required
  - Description: Creates a booking for an authenticated user

- **Create Guest Booking**:
  - `POST /api/bookings/guest`
  - Body: Booking details with guest information (see sample below)
  - Auth: Not required
  - Description: Creates a booking for a non-authenticated guest

## Sample Request/Response Structures

### Create Booking Request (Authenticated)
```json
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "start_date": "2023-07-15",
  "end_date": "2023-07-20",
  "room_id": 5,
  "number_of_guests": 2,
  "special_requests": "Need extra pillows",
  "notes": "Anniversary trip",
  "check_in_time": "14:00",
  "check_out_time": "11:00",
  "payment_method": "credit_card"
}
```

### Create Guest Booking Request
```json
POST /api/bookings/guest
Content-Type: application/json

{
  "start_date": "2023-07-15",
  "end_date": "2023-07-20",
  "room_id": 5,
  "number_of_guests": 2,
  "guest_name": "John Doe",
  "guest_email": "john.doe@example.com",
  "guest_phone": "+1234567890",
  "special_requests": "Need extra pillows",
  "notes": "Anniversary trip",
  "check_in_time": "14:00",
  "check_out_time": "11:00",
  "payment_method": "credit_card"
}
```

### Booking Response Structure
```json
{
  "status": "success",
  "data": {
    "id": 123,
    "start_date": "2023-07-15T00:00:00.000Z",
    "end_date": "2023-07-20T00:00:00.000Z",
    "room_id": 5,
    "status": "pending",
    "is_paid": false,
    "user_id": 8,
    "booking_number": "BK20230715123456",
    "total_price": 450.00,
    "payment_method": "credit_card",
    "check_in_time": "14:00:00",
    "check_out_time": "11:00:00",
    "number_of_guests": 2,
    "notes": "Anniversary trip",
    "special_requests": "Need extra pillows",
    "created_at": "2023-07-01T14:23:45.000Z",
    "updated_at": "2023-07-01T14:23:45.000Z",
    "room": {
      "id": 5,
      "title": "Deluxe Room",
      "room_number": "A105"
    },
    "homestay": {
      "id": 3,
      "title": "Mountain View Homestay"
    }
  }
}
```

## Missing Endpoints (Need Implementation)

Based on your requirements, the following endpoints are currently missing and should be implemented:

1. **Get All Bookings (Admin)**:
   - Suggested: `GET /api/bookings`
   - Query parameters for filtering by date range, status, etc.

2. **Get Bookings by Homestay**:
   - Suggested: `GET /api/bookings/homestay/:homestayId`
   - Returns all bookings for a specific homestay

3. **Get Bookings for Homestay Owner**:
   - Suggested: `GET /api/bookings/owner/:ownerId`
   - Returns all bookings for homestays owned by a specific owner

## CORS Configuration

The backend is configured with CORS allowing requests from all origins:

```javascript
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

This means requests from `http://localhost:8080` should be allowed. No additional headers are required for CORS.

## Recommendation for Next Steps

1. **Backend Updates Needed**:
   - Implement the missing endpoints for retrieving all bookings, bookings by homestay, and bookings by owner
   - Add filtering capabilities to booking endpoints (by date range, status, etc.)
   - Add pagination support for large datasets

2. **Frontend Adjustments**:
   - Update your API client to use the correct endpoints
   - Ensure proper authentication headers are set
   - Handle pagination for booking lists
   - Implement proper error handling based on status codes

3. **Testing Approach**:
   - Test with a valid admin token first
   - Verify authentication is working by checking the token in requests
   - Test with various query parameters to ensure filtering works
   - Test pagination with larger datasets

## Temporary Workaround

Until the missing endpoints are implemented, you can use the following approach:

1. For admin access to all bookings, you could:
   - Use `GET /api/bookings/user/:userId` with multiple requests for different users
   - Implement a custom endpoint on the backend for admin access

2. For homestay-specific bookings:
   - Query each room's bookings individually (not efficient but workable temporarily)

Please let us know if you need further assistance with API integration or if you need additional endpoints implemented to support your frontend requirements. 