# 🖼️ Frontend Homestay Images Integration Guide

## Current API Response Structure

Your backend now returns homestay data with this structure:

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "Beach Paradise Homestay",
      "description": "Beautiful beachfront location...",
      "base_price": 500000,
      "location": "Untung Jawa Island",
      "homestayImages": [
        {
          "id": 1,
          "img_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
          "is_primary": true,
          "order": 1
        },
        {
          "id": 2,
          "img_url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
          "is_primary": false,
          "order": 2
        }
      ],
      "rooms": [...],
      "owner_name": "John Doe"
    }
  ]
}
```

## ✅ How to Use Images in Your Frontend

### React/JavaScript Example:

```jsx
// HomestayCard.jsx
import React from 'react';

const HomestayCard = ({ homestay }) => {
  // Get images array (fallback to empty array if null)
  const images = homestay.homestayImages || [];
  
  // Get primary image, or first image, or fallback
  const primaryImage = images.find(img => img.is_primary) || images[0];
  const imageUrl = primaryImage?.img_url || '/default-homestay-image.jpg';
  
  // Get all image URLs for gallery
  const allImageUrls = images.map(img => img.img_url);

  return (
    <div className="homestay-card">
      {/* Main image */}
      <img 
        src={imageUrl} 
        alt={homestay.title}
        className="homestay-main-image"
        onError={(e) => {
          e.target.src = '/default-homestay-image.jpg';
        }}
      />
      
      {/* Image count indicator */}
      {images.length > 1 && (
        <div className="image-count">
          📷 {images.length} photos
        </div>
      )}
      
      {/* Homestay details */}
      <h3>{homestay.title}</h3>
      <p>{homestay.location}</p>
      <p>From IDR {homestay.base_price?.toLocaleString()}/night</p>
    </div>
  );
};

// HomestayGallery.jsx (for detail page)
const HomestayGallery = ({ homestay }) => {
  const images = homestay.homestayImages || [];
  
  if (images.length === 0) {
    return <div>No images available</div>;
  }

  return (
    <div className="homestay-gallery">
      {images.map((image, index) => (
        <img
          key={image.id}
          src={image.img_url}
          alt={`${homestay.title} - Image ${index + 1}`}
          className={`gallery-image ${image.is_primary ? 'primary' : ''}`}
        />
      ))}
    </div>
  );
};
```

### Vue.js Example:

```vue
<template>
  <div class="homestay-card">
    <img 
      :src="primaryImageUrl" 
      :alt="homestay.title"
      @error="handleImageError"
      class="homestay-image"
    />
    <h3>{{ homestay.title }}</h3>
    <p>{{ homestay.location }}</p>
  </div>
</template>

<script>
export default {
  props: ['homestay'],
  computed: {
    images() {
      return this.homestay.homestayImages || [];
    },
    primaryImageUrl() {
      const primaryImage = this.images.find(img => img.is_primary);
      return primaryImage?.img_url || this.images[0]?.img_url || '/default-image.jpg';
    }
  },
  methods: {
    handleImageError(event) {
      event.target.src = '/default-image.jpg';
    }
  }
}
</script>
```

### Vanilla JavaScript Example:

```javascript
// Function to render homestay cards
function renderHomestayCard(homestay) {
  const images = homestay.homestayImages || [];
  const primaryImage = images.find(img => img.is_primary) || images[0];
  const imageUrl = primaryImage?.img_url || '/default-image.jpg';
  
  return `
    <div class="homestay-card" data-id="${homestay.id}">
      <img src="${imageUrl}" alt="${homestay.title}" 
           onerror="this.src='/default-image.jpg'" />
      <h3>${homestay.title}</h3>
      <p>${homestay.location}</p>
      <p>From IDR ${homestay.base_price?.toLocaleString()}/night</p>
      ${images.length > 1 ? `<span class="image-count">${images.length} photos</span>` : ''}
    </div>
  `;
}

// API call and rendering
async function loadHomestays() {
  try {
    const response = await fetch('/api/homestays');
    const data = await response.json();
    
    if (data.status === 'success') {
      const homestaysHTML = data.data.map(renderHomestayCard).join('');
      document.getElementById('homestays-container').innerHTML = homestaysHTML;
    }
  } catch (error) {
    console.error('Error loading homestays:', error);
  }
}
```

## 🚨 Common Issues & Solutions

### Issue 1: Images not showing
```javascript
// ❌ Wrong: Looking for 'images' field
const imageUrl = homestay.images?.[0]?.url;

// ✅ Correct: Use 'homestayImages' field
const imageUrl = homestay.homestayImages?.[0]?.img_url;
```

### Issue 2: No fallback for missing images
```javascript
// ❌ Wrong: No fallback
<img src={homestay.homestayImages[0].img_url} />

// ✅ Correct: With fallbacks
const imageUrl = homestay.homestayImages?.[0]?.img_url || '/default-image.jpg';
<img src={imageUrl} onError={(e) => e.target.src = '/fallback.jpg'} />
```

### Issue 3: Not using primary image
```javascript
// ❌ Wrong: Just using first image
const imageUrl = homestay.homestayImages[0]?.img_url;

// ✅ Correct: Prefer primary image
const primaryImage = homestay.homestayImages?.find(img => img.is_primary);
const imageUrl = primaryImage?.img_url || homestay.homestayImages?.[0]?.img_url;
```

## 🎨 CSS Recommendations

```css
.homestay-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.homestay-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.gallery-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}

.gallery-image:hover {
  transform: scale(1.05);
}

.gallery-image.primary {
  border: 3px solid #007bff;
}
```

## 🧪 Testing Your Implementation

1. **Check Console**: Open browser dev tools and look for image URLs
2. **Network Tab**: Verify API calls return `homestayImages` field
3. **Test Error Handling**: Block image URLs to test fallbacks

## 📞 Need Help?

Run these debug commands:

```bash
# 1. Check database state
psql -h your_host -U user -d database -f debug_database.sql

# 2. Test API response
node debug_api_response.js

# 3. Check specific homestay
curl http://localhost:5000/api/homestays/49 | jq '.data.homestayImages'
``` 