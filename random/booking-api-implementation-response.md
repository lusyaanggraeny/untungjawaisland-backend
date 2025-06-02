# Backend Implementation of Booking Management Endpoints

## Implementation Status

We have implemented all three requested endpoints for the booking management system:

1. ✅ `GET /api/bookings` - Admin endpoint to view all bookings (MEDIUM PRIORITY)
2. ✅ `GET /api/bookings/owner/:ownerId` - Owner's bookings across all homestays (HIGH PRIORITY)
3. ✅ `GET /api/bookings/homestay/:homestayId` - Bookings for a specific homestay (MEDIUM PRIORITY)

## Endpoint Details

### 1. GET /api/bookings

**Purpose:** Allow super_admin users to view all bookings in the system.

**Authentication:** Required (super_admin access only)

**Query Parameters:**
- `status`: Filter by booking status (optional)
- `start_date`: Filter by start date (optional)
- `end_date`: Filter by end date (optional)
- `page`: For pagination (default: 1)
- `limit`: For pagination (default: 20)

**Response Format:**
```json
{
  "status": "success",
  "data": [
    {
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
    },
    // ... more bookings
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

### 2. GET /api/bookings/owner/:ownerId

**Purpose:** Allow homestay owners to view bookings for all of their homestays.

**Authentication:** Required
- `super_admin` can access any owner's bookings
- Other users can only access their own bookings

**Path Parameters:**
- `ownerId`: The ID of the homestay owner

**Query Parameters:**
- Same filtering and pagination options as GET /api/bookings

**Response Format:** Same as GET /api/bookings

### 3. GET /api/bookings/homestay/:homestayId

**Purpose:** Allow viewing bookings for a specific homestay.

**Authentication:** Required
- `super_admin` can access any homestay's bookings
- Owners can only access their own homestay bookings

**Path Parameters:**
- `homestayId`: The ID of the homestay

**Query Parameters:**
- Same filtering and pagination options as GET /api/bookings

**Response Format:** Same as GET /api/bookings

## Security Measures Implemented

1. **Authentication**: All endpoints use JWT token verification
2. **Authorization**: 
   - `super_admin` can access all endpoints and data
   - `homestay_owner` can only access their own data
3. **Input Validation**: Query parameters are validated and sanitized
4. **Pagination**: All endpoints support pagination for performance
5. **Error Handling**: Proper error responses with appropriate status codes

## Next Steps

1. Update the frontend to use the new endpoints
2. Add additional features:
   - More advanced filtering options
   - Sorting options
   - Export functionality

## Testing Instructions

You can test these endpoints using the following curl commands:

```bash
# Get all bookings (super_admin only)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/bookings

# Get bookings for a specific owner
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/bookings/owner/1

# Get bookings for a specific homestay
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/bookings/homestay/3
```

Please let us know if you encounter any issues or need additional features implemented.

## Contact

If you have questions about the API implementation, please reach out to the backend team. 