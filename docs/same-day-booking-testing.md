# Same-Day Booking System - Testing Guide

## 🚀 Setup Instructions

### 1. Run Database Migration
```sql
-- Execute this SQL to add the new fields (optional but recommended)
\i database/migrations/add_same_day_booking_fields.sql
```

### 2. Verify New Endpoint
The new endpoint should be available at:
```
GET /api/bookings/room/{roomId}/same-day-availability?date=YYYY-MM-DD
```

## 🧪 Testing Scenarios

### Scenario 1: Room Available (No Bookings Today)
**Setup:**
- Choose a room with no bookings for today
- Make sure room status is 'available'

**Test:**
```bash
curl -X GET "http://localhost:3000/api/bookings/room/1/same-day-availability" \
  -H "Content-Type: application/json"
```

**Expected Response:**
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

### Scenario 2: Early Checkout (The Main Fix!)
**Setup:**
1. Create a booking for today (status: 'confirmed')
2. Mark the booking as 'completed' via admin

**Step 1 - Create Today's Booking:**
```bash
curl -X POST "http://localhost:3000/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "start_date": "2024-06-05",
    "end_date": "2024-06-05",
    "room_id": 1,
    "number_of_guests": 2
  }'
```

**Step 2 - Mark as Completed:**
```bash
curl -X PUT "http://localhost:3000/api/bookings/BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "completed"
  }'
```

**Step 3 - Check Same-Day Availability:**
```bash
curl -X GET "http://localhost:3000/api/bookings/room/1/same-day-availability" \
  -H "Content-Type: application/json"
```

**Expected Response (Immediately After Checkout):**
```json
{
  "status": "success",
  "data": {
    "is_available": true,
    "early_checkout": true,
    "checkout_time": "14:30",
    "housekeeping_status": "in_progress",
    "housekeeping_complete_time": "16:30",
    "earliest_booking_time": "16:30",
    "can_book_today": true,
    "message": "Room will be available after housekeeping completion at 16:30",
    "previous_booking": {
      "id": 123,
      "booking_number": "BK-20240605-001",
      "checkout_time": "14:30"
    }
  }
}
```

**Expected Response (After 2 Hours):**
```json
{
  "status": "success",
  "data": {
    "is_available": true,
    "early_checkout": true,
    "checkout_time": "14:30",
    "housekeeping_status": "completed",
    "housekeeping_complete_time": "16:30",
    "earliest_booking_time": "now",
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

### Scenario 3: Room Currently Occupied
**Setup:**
- Create a booking for today that is still 'confirmed' (not completed)

**Test:**
```bash
curl -X GET "http://localhost:3000/api/bookings/room/1/same-day-availability" \
  -H "Content-Type: application/json"
```

**Expected Response:**
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

## 🔧 Frontend Integration Test

Create a simple HTML test page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Same-Day Booking Test</title>
    <style>
        .available { color: green; }
        .unavailable { color: red; }
        .early-checkout { background: #fef3c7; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Same-Day Booking Test</h1>
    <div id="status"></div>
    <button onclick="checkAvailability()">Check Room 1 Availability</button>
    
    <script>
        async function checkAvailability() {
            const statusDiv = document.getElementById('status');
            statusDiv.innerHTML = 'Loading...';
            
            try {
                const response = await fetch('/api/bookings/room/1/same-day-availability');
                const result = await response.json();
                const data = result.data;
                
                let html = `
                    <div class="${data.can_book_today ? 'available' : 'unavailable'}">
                        <h3>Status: ${data.message}</h3>
                        <p>Can book today: ${data.can_book_today ? 'YES' : 'NO'}</p>
                        <p>Available at: ${data.earliest_booking_time}</p>
                `;
                
                if (data.early_checkout) {
                    html += `
                        <div class="early-checkout">
                            <strong>Early Checkout Detected!</strong><br>
                            Checkout time: ${data.checkout_time}<br>
                            Housekeeping: ${data.housekeeping_status}<br>
                            ${data.housekeeping_status === 'in_progress' ? 
                                `Complete at: ${data.housekeeping_complete_time}` : 
                                'Ready now!'}
                        </div>
                    `;
                }
                
                html += '</div>';
                statusDiv.innerHTML = html;
                
            } catch (error) {
                statusDiv.innerHTML = `<div class="unavailable">Error: ${error.message}</div>`;
            }
        }
    </script>
</body>
</html>
```

## 🐛 Troubleshooting

### Issue 1: 404 Error
**Problem:** `Cannot GET /api/bookings/room/1/same-day-availability`

**Solution:** 
- Verify the route is added to `booking.routes.ts`
- Check the import in the controller
- Restart the server

### Issue 2: No Early Checkout Detection
**Problem:** Shows "available" but doesn't detect early checkout

**Check:**
1. Booking status was actually changed to 'completed'
2. The booking's `updated_at` field was updated
3. The date comparison logic is working

**Debug Query:**
```sql
SELECT id, booking_number, status, updated_at, 
       DATE(updated_at) as update_date,
       DATE(CURRENT_TIMESTAMP) as today
FROM "booking" 
WHERE room_id = 1 
  AND status = 'completed'
  AND start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE;
```

### Issue 3: Room Status Not Updating
**Problem:** Room stays 'occupied' after booking completion

**Check:** Look at the `updateBookingStatus` function - it should automatically update room status.

**Manual Fix:**
```sql
UPDATE "homestayRoom" 
SET status = 'available' 
WHERE id = 1; -- Replace with your room ID
```

## 📊 Database Queries for Testing

### Check Room Bookings for Today
```sql
SELECT b.*, 
       EXTRACT(EPOCH FROM (b.updated_at AT TIME ZONE 'UTC')) as updated_timestamp,
       DATE(b.updated_at) as update_date,
       DATE(CURRENT_TIMESTAMP) as today_date
FROM "booking" b
WHERE b.room_id = 1 
  AND b.start_date <= CURRENT_DATE 
  AND b.end_date >= CURRENT_DATE
ORDER BY b.updated_at DESC;
```

### Check Room Status
```sql
SELECT hr.id, hr.title, hr.status, hr.updated_at
FROM "homestayRoom" hr
WHERE hr.id = 1;
```

### Update Booking to Test Early Checkout
```sql
-- Simulate early checkout by updating a booking to completed
UPDATE "booking" 
SET status = 'completed', 
    updated_at = CURRENT_TIMESTAMP
WHERE id = YOUR_BOOKING_ID;
```

## ✅ Success Criteria

You've successfully implemented same-day booking when:

1. **404 Error Fixed** - The endpoint responds successfully
2. **Early Checkout Detected** - Completed bookings show early checkout info
3. **Housekeeping Timer Works** - Shows different messages before/after 2 hours
4. **Room Status Updates** - Rooms become available when bookings are marked complete
5. **Frontend Integration** - Your frontend can consume the new endpoint

## 🚦 Production Checklist

Before deploying to production:

- [ ] Database migration executed
- [ ] Endpoint tested with real data
- [ ] Error handling verified
- [ ] Frontend integration tested
- [ ] Room status updates working
- [ ] Booking workflow tested end-to-end
- [ ] Performance tested with multiple rooms
- [ ] Logs are showing proper information

**The key fix is that the 404 error will be resolved, and your frontend will be able to handle same-day bookings with early checkout scenarios!** 🎉 