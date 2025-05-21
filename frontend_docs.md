# Homestay Room System Documentation

## Database Schema

### homestayRoom Table
```sql
CREATE TABLE "homestayRoom" (
  "id" SERIAL PRIMARY KEY,
  "homestay_id" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" room_status NOT NULL DEFAULT 'available',
  "room_number" VARCHAR(50),
  "number_people" INTEGER NOT NULL,
  "max_occupancy" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
  "size" VARCHAR(50),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "homestay_room" FOREIGN KEY ("homestay_id") REFERENCES "homestay" ("id") ON DELETE CASCADE
);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Unique identifier for the room |
| homestay_id | INTEGER | Foreign key linking to parent homestay |
| title | VARCHAR(255) | Room name/title |
| description | TEXT | Detailed room description (optional) |
| status | ENUM | Room availability status ('available', 'occupied', 'maintenance') |
| room_number | VARCHAR(50) | Room number identifier (optional) |
| number_people | INTEGER | Base number of people the room accommodates |
| max_occupancy | INTEGER | Maximum number of people allowed |
| price | DECIMAL(10,2) | Room price per night |
| currency | VARCHAR(3) | Price currency (defaults to 'IDR') |
| size | VARCHAR(50) | Room size (optional, e.g., "30m²") |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record last update timestamp |

## API Endpoints for Room Operations

### 1. Get All Rooms for a Homestay
```
GET /api/homestays/:homestayId
```

Response includes complete homestay details with rooms:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "Cozy Beachside Homestay",
    "description": "A comfortable homestay near the beach, perfect for families.",
    "user_id": 1,
    "status": "active",
    "has_rooms": true,
    "location": "Bali, Indonesia",
    "address": "Jl. Pantai Kuta No. 123, Kuta, Bali",
    "base_price": 500000.00,
    "max_guests": 4,
    "contact_number": "+628123456789",
    "created_at": "2023-06-15T08:30:00Z",
    "updated_at": "2023-06-15T08:30:00Z",
    "owner_name": "Budi Santoso",
    "images": [
      {
        "id": 1,
        "img_url": "https://example.com/images/homestay1_1.jpg",
        "is_primary": true,
        "order": 1
      }
    ],
    "rooms": [
      {
        "id": 1,
        "title": "Standard Room",
        "description": "Comfortable standard room with all basic amenities",
        "status": "available",
        "room_number": "S-1-1",
        "number_people": 2,
        "max_occupancy": 3,
        "price": 300000.00,
        "currency": "IDR",
        "size": "20m²",
        "features": [
          {
            "id": 1,
            "title": "Queen Bed",
            "description": "Comfortable queen-sized bed",
            "symbol": "bed",
            "category": "bedroom"
          },
          {
            "id": 5,
            "title": "Air Conditioning",
            "description": "24-hour air conditioning",
            "symbol": "ac",
            "category": "comfort"
          }
        ]
      }
    ]
  }
}
```

### 2. Get All Available Rooms (For Booking)
```
GET /api/rooms/available?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&guests=2
```

Query Parameters:
- `start_date`: Check-in date (required)
- `end_date`: Check-out date (required)
- `guests`: Number of guests (optional, default: 1)

Response:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "homestay_id": 1, 
      "homestay_title": "Cozy Beachside Homestay",
      "homestay_location": "Bali, Indonesia",
      "title": "Standard Room",
      "description": "Comfortable standard room with all basic amenities",
      "status": "available",
      "room_number": "S-1-1",
      "number_people": 2,
      "max_occupancy": 3,
      "price": 300000.00,
      "currency": "IDR",
      "size": "20m²",
      "image": "https://example.com/images/homestay1_1.jpg",
      "features": [
        {
          "id": 1,
          "title": "Queen Bed",
          "category": "bedroom"
        },
        {
          "id": 5,
          "title": "Air Conditioning",
          "category": "comfort"
        }
      ]
    }
  ]
}
```

### 3. Book a Room
```
POST /api/bookings
```

Request Body:
```json
{
  "room_id": 1,
  "start_date": "2023-08-15",
  "end_date": "2023-08-20",
  "number_of_guests": 2,
  "user_id": 5,
  "special_requests": "Early check-in if possible",
  "notes": "Anniversary trip"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": 10,
    "booking_number": "BK-20230815-001",
    "room_id": 1,
    "start_date": "2023-08-15T00:00:00Z",
    "end_date": "2023-08-20T00:00:00Z",
    "status": "pending",
    "is_paid": false,
    "number_of_guests": 2,
    "total_price": 1500000.00,
    "payment_method": null,
    "user_id": 5,
    "created_at": "2023-08-01T15:30:45Z",
    "updated_at": "2023-08-01T15:30:45Z"
  }
}
```

### 4. Get Room Details
```
GET /api/rooms/:id
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "homestay_id": 1,
    "homestay": {
      "id": 1,
      "title": "Cozy Beachside Homestay",
      "location": "Bali, Indonesia",
      "address": "Jl. Pantai Kuta No. 123, Kuta, Bali",
      "owner_name": "Budi Santoso",
      "contact_number": "+628123456789"
    },
    "title": "Standard Room",
    "description": "Comfortable standard room with all basic amenities",
    "status": "available",
    "room_number": "S-1-1",
    "number_people": 2,
    "max_occupancy": 3,
    "price": 300000.00,
    "currency": "IDR",
    "size": "20m²",
    "features": [
      {
        "id": 1,
        "title": "Queen Bed",
        "description": "Comfortable queen-sized bed",
        "symbol": "bed",
        "category": "bedroom"
      },
      {
        "id": 5,
        "title": "Air Conditioning",
        "description": "24-hour air conditioning",
        "symbol": "ac",
        "category": "comfort"
      }
    ],
    "availability": [
      {
        "date": "2023-08-15",
        "is_available": false
      },
      {
        "date": "2023-08-16",
        "is_available": false
      },
      {
        "date": "2023-08-17",
        "is_available": true
      }
    ],
    "created_at": "2023-06-15T09:30:00Z",
    "updated_at": "2023-06-15T09:30:00Z"
  }
}
```

## Room Features System

Rooms can have various features associated with them through a many-to-many relationship:

### Feature Categories
- bedroom (bed-related features)
- bathroom (bathroom amenities)
- kitchen (kitchen facilities)
- entertainment (TV, WiFi, etc.)
- comfort (AC, heating, etc.)
- safety (security features)
- accessibility (disability features)
- outdoor (balcony, garden, etc.)
- service (room service, cleaning)
- storage (closet, safe)
- view (room view features)
- dining (dining area, breakfast)
- business (desk, printer)
- wellness (spa, fitness)
- transportation (shuttle, parking)

## TypeScript Interfaces

```typescript
// Room status enum
export enum RoomStatus {
  Available = 'available',
  Occupied = 'occupied',
  Maintenance = 'maintenance'
}

// Room interface
export interface HomestayRoom {
  id: number;
  homestay_id: number;
  title: string;
  description: string | null;
  status: RoomStatus;
  room_number: string | null;
  number_people: number;
  max_occupancy: number;
  price: number;
  currency: string;
  size: string | null;
  created_at: Date;
  updated_at: Date;
  features?: RoomFeature[]; // Optional, if fetched via join
}

// Feature category enum
export enum FeatureCategory {
  Bedroom = 'bedroom',
  Bathroom = 'bathroom',
  Kitchen = 'kitchen',
  Entertainment = 'entertainment',
  Comfort = 'comfort',
  Safety = 'safety',
  Accessibility = 'accessibility',
  Outdoor = 'outdoor',
  Service = 'service',
  Storage = 'storage',
  View = 'view',
  Dining = 'dining',
  Business = 'business',
  Wellness = 'wellness',
  Transportation = 'transportation'
}

// Room feature interface
export interface RoomFeature {
  id: number;
  title: string;
  description: string | null;
  symbol: string | null;
  category: FeatureCategory;
  created_at: Date;
  updated_at: Date;
}

// Input for creating a booking
export interface BookingCreateInput {
  room_id: number;
  start_date: string; // Format: YYYY-MM-DD
  end_date: string; // Format: YYYY-MM-DD
  number_of_guests: number;
  user_id?: number; // Optional if booking for a guest
  special_requests?: string;
  notes?: string;
}
```

## Implementation Notes for Frontend

### Room Status Handling
- **Available**: Room can be booked for selected dates
- **Occupied**: Room is currently occupied but may be available for future dates
- **Maintenance**: Room is temporarily unavailable for booking

### Price Display
- Always display the price with the currency symbol/code
- Default currency is IDR (Indonesian Rupiah)
- Consider formatting prices with thousand separators (e.g., "300.000 IDR")

### Occupancy Rules
- `number_people` represents the standard occupancy
- `max_occupancy` is the absolute maximum allowed
- Consider implementing visual indicators for both values
- Create warnings if guests exceed standard occupancy

### Room Features Display
- Group features by category for better organization
- Use provided symbols for visual representation when available
- Consider implementing feature filters in room search

### Error Handling
Common error scenarios to prepare for:
- Room not found (404)
- Room unavailable for selected dates (400)
- Exceeding max occupancy (400)
- Overlapping bookings (409)
- User validation errors (400)

### Best Practices
1. **Validation**:
   - Validate date ranges (check-in before check-out)
   - Validate number of guests against room capacity
   - Prevent bookings in the past

2. **User Experience**:
   - Implement calendar view for availability
   - Show pricing calculations for multi-day stays
   - Provide clear room comparison features
   - Use visual indicators for room status and features

3. **Performance**:
   - Cache room data when appropriate
   - Implement lazy loading for images
   - Consider virtual scrolling for long lists of rooms 