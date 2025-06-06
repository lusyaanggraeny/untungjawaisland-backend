# Frontend API Integration Guide - Enhanced Room Booking

## 🚀 Quick Start

Base URL: `http://localhost:5000/api` (development) or `https://your-api-domain.com/api` (production)

## 📋 New Enhanced Endpoints

### 1. Enhanced Room Availability Check
```typescript
// GET /api/bookings/room/{roomId}/availability
interface AvailabilityResponse {
  status: 'success';
  data: {
    is_available: boolean;
    room_status: string;
    has_bookings: boolean;
    current_booking: {
      id: number;
      start_date: string; // YYYY-MM-DD
      end_date: string;   // YYYY-MM-DD
      booking_number: string;
    } | null;
    next_available_date: string | null; // YYYY-MM-DD
    upcoming_bookings: Array<{
      id: number;
      start_date: string;
      end_date: string;
      booking_number: string;
    }>;
  };
}

// Usage Example
const checkAvailability = async (roomId: number, startDate: string, endDate: string) => {
  const response = await fetch(
    `/api/bookings/room/${roomId}/availability?start_date=${startDate}&end_date=${endDate}`
  );
  const data: AvailabilityResponse = await response.json();
  return data.data;
};
```

### 2. Room Booking History
```typescript
// GET /api/bookings/room/{roomId}
interface RoomBookingsResponse {
  status: 'success';
  data: Array<{
    id: number;
    booking_number: string;
    start_date: string;
    end_date: string;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    number_of_guests: number;
    guest_name: string | null;
    user_id: number | null;
  }>;
}

// Usage Example
const getRoomBookings = async (roomId: number, options?: {
  startDate?: string;
  endDate?: string;
  includeCancelled?: boolean;
}) => {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('start_date', options.startDate);
  if (options?.endDate) params.append('end_date', options.endDate);
  if (options?.includeCancelled) params.append('include_cancelled', 'true');
  
  const response = await fetch(`/api/bookings/room/${roomId}?${params}`);
  const data: RoomBookingsResponse = await response.json();
  return data.data;
};
```

### 3. Dynamic Room Status
```typescript
// GET /api/rooms/{roomId}/status
interface RoomStatusResponse {
  status: 'success';
  data: {
    room_id: number;
    static_status: 'available' | 'maintenance' | 'occupied';
    dynamic_status: 'available' | 'maintenance' | 'occupied';
    is_bookable: boolean;
    reason: string;
    next_available_date: string | null;
    maintenance_end_date: string | null;
  };
}

// Usage Example
const getRoomStatus = async (roomId: number) => {
  const response = await fetch(`/api/rooms/${roomId}/status`);
  const data: RoomStatusResponse = await response.json();
  return data.data;
};
```

### 4. Homestay Rooms Overview
```typescript
// GET /api/rooms/homestay/{homestayId}/status
interface HomestayRoomsResponse {
  status: 'success';
  data: Array<{
    room_id: number;
    room_number: string;
    static_status: 'available' | 'maintenance' | 'occupied';
    dynamic_status: 'available' | 'maintenance' | 'occupied';
    is_bookable: boolean;
    next_available_date: string | null;
    current_booking_end: string | null;
  }>;
}

// Usage Example
const getHomestayRoomsStatus = async (homestayId: number) => {
  const response = await fetch(`/api/rooms/homestay/${homestayId}/status`);
  const data: HomestayRoomsResponse = await response.json();
  return data.data;
};
```

## 🔧 Quick Implementation Examples

### Check Room Availability
```javascript
// Simple usage
const checkRoomDates = async (roomId, startDate, endDate) => {
  const response = await fetch(
    `/api/bookings/room/${roomId}/availability?start_date=${startDate}&end_date=${endDate}`
  );
  const data = await response.json();

  console.log('Available:', data.data.is_available);
  console.log('Next available:', data.data.next_available_date);
  console.log('Current booking:', data.data.current_booking);
  
  return data.data;
};
```

### Get Room Status
```javascript
const checkRoomStatus = async (roomId) => {
  const response = await fetch(`/api/rooms/${roomId}/status`);
  const data = await response.json();

  console.log('Room status:', data.data.dynamic_status);
  console.log('Can book:', data.data.is_bookable);
  console.log('Reason:', data.data.reason);
  
  return data.data;
};
```

### Get All Rooms in Homestay
```javascript
const getHomestayOverview = async (homestayId) => {
  const response = await fetch(`/api/rooms/homestay/${homestayId}/status`);
  const data = await response.json();

  const availableCount = data.data.filter(room => room.is_bookable).length;
  const occupiedCount = data.data.filter(room => room.dynamic_status === 'occupied').length;
  
  console.log(`Available: ${availableCount}, Occupied: ${occupiedCount}`);
  
  return data.data;
};
```

## 🎯 Key Benefits for Frontend

✅ **Real booking dates** - No more guessing  
✅ **Single API calls** - No more day-by-day checking  
✅ **Current occupancy** - Real-time room status  
✅ **Next available dates** - Suggest alternatives  
✅ **Bulk operations** - Dashboard overviews  

## 📱 React Component Examples

### Booking Form with Real Availability
```jsx
const BookingForm = ({ roomId }) => {
  const [dates, setDates] = useState({ start: '', end: '' });
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkDates = async () => {
    if (!dates.start || !dates.end) return;
    
    setLoading(true);
    try {
      const data = await checkAvailability(roomId, dates.start, dates.end);
      setAvailability(data);
    } catch (error) {
      console.error('Failed to check availability:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form">
      <input 
        type="date" 
        value={dates.start}
        onChange={(e) => setDates({...dates, start: e.target.value})}
      />
      <input 
        type="date" 
        value={dates.end}
        onChange={(e) => setDates({...dates, end: e.target.value})}
      />
      <button onClick={checkDates} disabled={loading}>
        Check Availability
      </button>
      
      {availability && (
        <div className="availability-result">
          {availability.is_available ? (
            <div className="available">✅ Room is available!</div>
          ) : (
            <div className="unavailable">
              ❌ Room not available
              {availability.next_available_date && (
                <p>Next available: {availability.next_available_date}</p>
              )}
              {availability.current_booking && (
                <p>Currently booked until: {availability.current_booking.end_date}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Room Status Badge
```jsx
const RoomStatusBadge = ({ roomId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoomStatus(roomId)
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) return <div>Loading...</div>;
  if (!status) return <div>Error loading status</div>;

  const getStatusColor = () => {
    switch (status.dynamic_status) {
      case 'available': return '#10B981'; // green
      case 'occupied': return '#EF4444';  // red
      case 'maintenance': return '#F59E0B'; // orange
      default: return '#6B7280'; // gray
    }
  };

  return (
    <div 
      className="room-status-badge"
      style={{ 
        backgroundColor: getStatusColor(),
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px'
      }}
    >
      <span>{status.dynamic_status.toUpperCase()}</span>
      {!status.is_bookable && (
        <div style={{ fontSize: '10px', marginTop: '2px' }}>
          {status.reason}
        </div>
      )}
    </div>
  );
};
```

### Homestay Dashboard
```jsx
const HomestayDashboard = ({ homestayId }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomestayRoomsStatus(homestayId)
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [homestayId]);

  if (loading) return <div>Loading dashboard...</div>;

  const stats = {
    available: rooms.filter(room => room.is_bookable).length,
    occupied: rooms.filter(room => room.dynamic_status === 'occupied').length,
    maintenance: rooms.filter(room => room.dynamic_status === 'maintenance').length,
    total: rooms.length
  };

  return (
    <div className="homestay-dashboard">
      <div className="stats-grid">
        <div className="stat-card available">
          <h3>{stats.available}</h3>
          <p>Available</p>
        </div>
        <div className="stat-card occupied">
          <h3>{stats.occupied}</h3>
          <p>Occupied</p>
        </div>
        <div className="stat-card maintenance">
          <h3>{stats.maintenance}</h3>
          <p>Maintenance</p>
        </div>
        <div className="stat-card total">
          <h3>{stats.total}</h3>
          <p>Total Rooms</p>
        </div>
      </div>
      
      <div className="rooms-grid">
        {rooms.map(room => (
          <div key={room.room_id} className={`room-card ${room.dynamic_status}`}>
            <h4>Room {room.room_number}</h4>
            <RoomStatusBadge roomId={room.room_id} />
            {room.current_booking_end && (
              <p className="booking-info">
                Occupied until: {room.current_booking_end}
              </p>
            )}
            {room.next_available_date && !room.is_bookable && (
              <p className="next-available">
                Next available: {room.next_available_date}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🚦 Error Handling

```javascript
// Generic error handler
const handleApiError = (error, context = 'API call') => {
  console.error(`${context} failed:`, error);
  
  if (error.response) {
    // API returned an error
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return `Invalid request: ${data.message}`;
      case 404:
        return `Not found: ${data.message}`;
      case 500:
        return `Server error: ${data.message}`;
      default:
        return `Error: ${data.message}`;
    }
  } else {
    // Network or other error
    return `Network error: ${error.message}`;
  }
};

// Safe API wrapper
const safeApiCall = async (apiFunction, ...args) => {
  try {
    return await apiFunction(...args);
  } catch (error) {
    const errorMessage = handleApiError(error, apiFunction.name);
    // Show user-friendly error message
    alert(errorMessage);
    return null;
  }
};

// Usage
const availability = await safeApiCall(checkAvailability, 123, '2024-01-15', '2024-01-17');
```

## 🔗 Quick Reference

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /api/bookings/room/{id}/availability` | Check availability + get booking info | Availability data with current/upcoming bookings |
| `GET /api/bookings/room/{id}` | Get room's booking history | Array of bookings with guest info |
| `GET /api/rooms/{id}/status` | Get real-time room status | Dynamic status + bookability |
| `GET /api/rooms/homestay/{id}/status` | Get all rooms status | Array of room statuses |

## 🛠 Integration Checklist

- [ ] Copy TypeScript interfaces to your project
- [ ] Create API helper functions
- [ ] Update booking form to use new availability endpoint
- [ ] Add room status indicators to your UI
- [ ] Implement homestay dashboard with bulk status
- [ ] Add error handling for API calls
- [ ] Test with different room IDs and date ranges

## 💡 Pro Tips

1. **Cache results** for 30 seconds to avoid excessive API calls
2. **Use loading states** while fetching data
3. **Show next available dates** when rooms are unavailable
4. **Implement real-time updates** by polling every 30 seconds
5. **Handle edge cases** like invalid room IDs gracefully

Ready to implement! 🚀

These endpoints will give you real booking data instead of guessing availability.
