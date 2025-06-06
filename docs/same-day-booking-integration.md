# Same-Day Booking System - Frontend Integration Guide

## 🚀 New Endpoint Overview

**Endpoint**: `GET /api/bookings/room/{roomId}/same-day-availability`

**Query Parameters**:
- `date` (optional): YYYY-MM-DD format (defaults to today)

**Purpose**: Handle same-day booking scenarios including early checkout detection

## 📋 Response Format

### Scenario 1: Room is Available (No bookings today)
```json
{
  "status": "success",
  "data": {
    "is_available": true,
    "early_checkout": false,
    "earliest_booking_time": "now",
    "can_book_today": true,
    "message": "Room is available for same-day booking"
  }
}
```

### Scenario 2: Early Checkout (Room was booked but guest checked out)
```json
{
  "status": "success",
  "data": {
    "is_available": true,
    "early_checkout": true,
    "checkout_time": "14:30",
    "housekeeping_status": "completed", // or "in_progress"
    "housekeeping_complete_time": "16:30",
    "earliest_booking_time": "now", // or time when housekeeping completes
    "can_book_today": true,
    "message": "Room available after early checkout - housekeeping completed",
    "previous_booking": {
      "id": 123,
      "booking_number": "BK-20240605-001",
      "checkout_time": "14:30"
    }
  }
}
```

### Scenario 3: Room is Occupied
```json
{
  "status": "success",
  "data": {
    "is_available": false,
    "early_checkout": false,
    "current_booking": {
      "id": 124,
      "booking_number": "BK-20240605-002",
      "end_date": "2024-06-05T18:00:00.000Z",
      "status": "confirmed"
    },
    "earliest_booking_time": "18:00",
    "message": "Room is currently occupied",
    "can_book_today": false
  }
}
```

## 🔧 Frontend Implementation

### 1. Basic Same-Day Availability Check
```typescript
interface SameDayAvailabilityResponse {
  status: 'success';
  data: {
    is_available: boolean;
    early_checkout: boolean;
    earliest_booking_time: string;
    can_book_today: boolean;
    message: string;
    checkout_time?: string;
    housekeeping_status?: 'completed' | 'in_progress';
    housekeeping_complete_time?: string;
    current_booking?: {
      id: number;
      booking_number: string;
      end_date: string;
      status: string;
    };
    previous_booking?: {
      id: number;
      booking_number: string;
      checkout_time: string;
    };
  };
}

const checkSameDayAvailability = async (
  roomId: number, 
  date?: string
): Promise<SameDayAvailabilityResponse['data']> => {
  const dateParam = date ? `?date=${date}` : '';
  const response = await fetch(
    `/api/bookings/room/${roomId}/same-day-availability${dateParam}`
  );
  const data: SameDayAvailabilityResponse = await response.json();
  return data.data;
};
```

### 2. React Component for Same-Day Booking
```tsx
import React, { useState, useEffect } from 'react';

interface Props {
  roomId: number;
  onBookingAvailable: (canBook: boolean) => void;
}

const SameDayBookingCheck: React.FC<Props> = ({ roomId, onBookingAvailable }) => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const data = await checkSameDayAvailability(roomId);
        setAvailability(data);
        onBookingAvailable(data.can_book_today);
        
        // Set up countdown for housekeeping completion
        if (data.early_checkout && data.housekeeping_status === 'in_progress') {
          startCountdown(data.housekeeping_complete_time);
        }
      } catch (error) {
        console.error('Failed to check same-day availability:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
    
    // Poll every 5 minutes for updates
    const interval = setInterval(checkAvailability, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [roomId]);

  const startCountdown = (targetTime: string) => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      const [hours, minutes] = targetTime.split(':');
      target.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('Available now!');
        // Refresh availability
        checkSameDayAvailability(roomId).then(data => {
          setAvailability(data);
          onBookingAvailable(data.can_book_today);
        });
        return;
      }
      
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`Available in ${hoursLeft}h ${minutesLeft}m`);
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 60000); // Update every minute
    
    // Cleanup function
    return () => clearInterval(countdownInterval);
  };

  if (loading) {
    return <div className="loading">Checking same-day availability...</div>;
  }

  if (!availability) {
    return <div className="error">Failed to load availability</div>;
  }

  return (
    <div className="same-day-booking-status">
      <div className={`status-indicator ${availability.can_book_today ? 'available' : 'unavailable'}`}>
        <h3>Same-Day Booking Status</h3>
        <p className="message">{availability.message}</p>
        
        {availability.early_checkout && (
          <div className="early-checkout-info">
            <p>✅ Early checkout detected</p>
            <p>Guest checked out at: {availability.checkout_time}</p>
            
            {availability.housekeeping_status === 'in_progress' && (
              <div className="housekeeping-progress">
                <p>🧹 Housekeeping in progress...</p>
                <p className="countdown">{countdown}</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '60%'}}></div>
                </div>
              </div>
            )}
            
            {availability.housekeeping_status === 'completed' && (
              <p className="available-now">🎉 Room ready for immediate booking!</p>
            )}
          </div>
        )}
        
        {!availability.can_book_today && availability.current_booking && (
          <div className="occupied-info">
            <p>Currently occupied by booking: {availability.current_booking.booking_number}</p>
            <p>Available after: {availability.earliest_booking_time}</p>
          </div>
        )}
        
        {availability.can_book_today && (
          <div className="booking-cta">
            <button 
              className="book-now-btn"
              disabled={!availability.can_book_today}
            >
              {availability.earliest_booking_time === 'now' 
                ? 'Book Now' 
                : `Book from ${availability.earliest_booking_time}`
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SameDayBookingCheck;
```

### 3. Admin Dashboard Integration
```tsx
const AdminBookingDashboard = () => {
  const [rooms, setRooms] = useState([]);

  const checkAllRoomsToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const roomPromises = rooms.map(room => 
      checkSameDayAvailability(room.id, today)
    );
    
    const results = await Promise.all(roomPromises);
    
    // Update room statuses with same-day availability info
    const updatedRooms = rooms.map((room, index) => ({
      ...room,
      sameDayStatus: results[index]
    }));
    
    setRooms(updatedRooms);
  };

  return (
    <div className="admin-dashboard">
      <h2>Today's Room Status</h2>
      <button onClick={checkAllRoomsToday}>Refresh Same-Day Status</button>
      
      <div className="rooms-grid">
        {rooms.map(room => (
          <div key={room.id} className="room-card">
            <h3>Room {room.number}</h3>
            
            {room.sameDayStatus?.early_checkout && (
              <div className="early-checkout-badge">
                Early Checkout at {room.sameDayStatus.checkout_time}
              </div>
            )}
            
            <div className={`status ${room.sameDayStatus?.can_book_today ? 'available' : 'occupied'}`}>
              {room.sameDayStatus?.message}
            </div>
            
            {room.sameDayStatus?.housekeeping_status === 'in_progress' && (
              <div className="housekeeping-status">
                🧹 Housekeeping until {room.sameDayStatus.housekeeping_complete_time}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. Booking Form Enhancement
```tsx
const BookingForm = ({ roomId }: { roomId: number }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [sameDayInfo, setSameDayInfo] = useState(null);
  const [showSameDayOption, setShowSameDayOption] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
      // Check same-day availability
      checkSameDayAvailability(roomId, today).then(data => {
        setSameDayInfo(data);
        setShowSameDayOption(true);
      });
    } else {
      setShowSameDayOption(false);
      setSameDayInfo(null);
    }
  }, [selectedDate, roomId]);

  return (
    <form className="booking-form">
      <div className="form-group">
        <label>Check-in Date:</label>
        <input 
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {showSameDayOption && sameDayInfo && (
        <div className="same-day-notice">
          {sameDayInfo.early_checkout ? (
            <div className="early-checkout-notice">
              <h4>🎉 Same-Day Booking Available!</h4>
              <p>Room had early checkout at {sameDayInfo.checkout_time}</p>
              
              {sameDayInfo.housekeeping_status === 'completed' ? (
                <p className="available">✅ Ready for immediate booking</p>
              ) : (
                <p className="pending">🧹 Available after housekeeping (around {sameDayInfo.housekeeping_complete_time})</p>
              )}
            </div>
          ) : sameDayInfo.can_book_today ? (
            <div className="available-notice">
              <p>✅ Room available for same-day booking</p>
            </div>
          ) : (
            <div className="unavailable-notice">
              <p>❌ Room not available today</p>
              <p>Currently occupied until {sameDayInfo.earliest_booking_time}</p>
            </div>
          )}
        </div>
      )}

      <button 
        type="submit"
        disabled={showSameDayOption && !sameDayInfo?.can_book_today}
      >
        {showSameDayOption && sameDayInfo?.earliest_booking_time !== 'now' 
          ? `Book from ${sameDayInfo.earliest_booking_time}`
          : 'Book Now'
        }
      </button>
    </form>
  );
};
```

## 🎯 Key Features

### ✅ What This Gives You:
1. **Early Checkout Detection** - Automatically detect when guests check out early
2. **Housekeeping Tracking** - 2-hour housekeeping window after checkout
3. **Real-time Updates** - Live status updates for same-day availability
4. **Smart Booking** - Allow same-day bookings when rooms become available
5. **Admin Dashboard** - Overview of all rooms' same-day status

### 🔄 Integration Flow:
1. **Guest checks out early** → Admin marks booking as "completed"
2. **System detects early checkout** → Room available but housekeeping in progress
3. **After 2 hours** → Room fully available for new bookings
4. **Frontend shows live status** → Users can book same-day

## 🚦 Error Handling

```typescript
const handleSameDayBooking = async (roomId: number) => {
  try {
    const availability = await checkSameDayAvailability(roomId);
    
    if (!availability.can_book_today) {
      throw new Error(availability.message);
    }
    
    if (availability.earliest_booking_time !== 'now') {
      const confirmMessage = `Room will be available at ${availability.earliest_booking_time}. Continue?`;
      if (!confirm(confirmMessage)) return;
    }
    
    // Proceed with booking
    await createBooking({
      roomId,
      startDate: new Date().toISOString().split('T')[0],
      // ... other booking details
    });
    
  } catch (error) {
    alert(`Same-day booking failed: ${error.message}`);
  }
};
```

## 📱 CSS Styling Example

```css
.same-day-booking-status {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.status-indicator.available {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.status-indicator.unavailable {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.early-checkout-info {
  background-color: #fef3c7;
  padding: 12px;
  border-radius: 6px;
  margin: 8px 0;
}

.housekeeping-progress {
  margin: 8px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.countdown {
  font-weight: bold;
  color: #1f2937;
}
```

This implementation provides a complete same-day booking system that handles early checkouts, housekeeping schedules, and real-time availability updates! 🚀 