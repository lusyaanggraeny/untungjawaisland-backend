# 🌍 Multilingual Backend Implementation Guide

## 📋 Overview

This guide covers the complete implementation of multilingual support for the Untung Jawa backend system. The implementation allows dynamic translation of homestay and room content based on user language preference.

## 🗂️ Files Created/Modified

### **New Files Created:**
- `src/database/migrations/add_translation_tables.sql` - Database schema for translations
- `src/database/migrations/add_sample_translations.sql` - Sample Indonesian translations
- `src/types/translation.types.ts` - TypeScript types for translations
- `src/utils/translation.utils.ts` - Translation utility functions
- `src/scripts/run-translation-migration.ts` - Migration script
- `test-translation-api.js` - API testing script

### **Modified Files:**
- `src/controllers/homestay.controller.ts` - Added translation support
- `src/controllers/room.controller.ts` - Added translation support

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

```bash
# Option 1: Run TypeScript migration script
npx ts-node src/scripts/run-translation-migration.ts

# Option 2: Run SQL directly in your database
psql -h localhost -U your_username -d your_database -f src/database/migrations/add_translation_tables.sql
psql -h localhost -U your_username -d your_database -f src/database/migrations/add_sample_translations.sql
```

### **Step 2: Restart Your Server**

```bash
npm run dev
# or
npm start
```

### **Step 3: Test the API**

```bash
node test-translation-api.js
```

## 📊 Database Schema

### **New Tables Created:**

#### `homestay_translations`
```sql
- id (SERIAL PRIMARY KEY)
- homestay_id (INTEGER, FK to homestay.id)
- language_code (VARCHAR(5)) -- 'en', 'id', etc.
- title (VARCHAR(255))
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(homestay_id, language_code)
```

#### `room_translations`
```sql
- id (SERIAL PRIMARY KEY)
- room_id (INTEGER, FK to homestayRoom.id)
- language_code (VARCHAR(5)) -- 'en', 'id', etc.
- title (VARCHAR(255))
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(room_id, language_code)
```

## 🔧 API Usage

### **Language Parameter**

All endpoints now accept an optional `lang` query parameter:

```
GET /api/homestays?lang=id          # Indonesian
GET /api/homestays?lang=en          # English (default)
GET /api/homestays/1?lang=id        # Specific homestay in Indonesian
GET /api/rooms?lang=id              # All rooms in Indonesian
GET /api/rooms/49?lang=id           # Specific room in Indonesian
```

### **Supported Languages**

- `en` - English (default)
- `id` - Bahasa Indonesia

### **Response Format**

The API response format remains the same, but content is now translated:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "Rumah Pantai Nyaman",  // ← Translated to Indonesian
    "description": "Homestay tepi pantai yang indah...", // ← Translated
    "rooms": [
      {
        "id": 49,
        "title": "Kamar Deluxe",     // ← Translated
        "description": "Kamar deluxe yang luas..." // ← Translated
      }
    ]
  }
}
```

## 🧪 Testing

### **Manual Testing**

1. **Test English (default):**
   ```bash
   curl "http://localhost:3000/api/homestays"
   ```

2. **Test Indonesian:**
   ```bash
   curl "http://localhost:3000/api/homestays?lang=id"
   ```

3. **Test fallback (invalid language):**
   ```bash
   curl "http://localhost:3000/api/homestays?lang=es"
   ```

### **Automated Testing**

Run the provided test script:
```bash
node test-translation-api.js
```

## 📈 Performance Considerations

- **Caching**: Translation queries are optimized with proper indexing
- **Fallback**: Invalid language codes automatically fallback to English
- **Batch Queries**: Room translations are fetched in batches for better performance

## 🔄 Adding More Languages

To add support for additional languages:

1. **Update supported languages:**
   ```typescript
   // src/types/translation.types.ts
   export type SupportedLanguage = 'en' | 'id' | 'es' | 'fr'; // Add new languages
   export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'id', 'es', 'fr'];
   ```

2. **Add translations to database:**
   ```sql
   INSERT INTO "homestay_translations" (homestay_id, language_code, title, description) VALUES
   (1, 'es', 'Casa de Playa Acogedora', 'Hermosa casa frente al mar...');
   ```

## 🛠️ Content Management

### **Adding New Translations**

```sql
-- Add homestay translation
INSERT INTO "homestay_translations" (homestay_id, language_code, title, description)
VALUES (1, 'id', 'Homestay Baru', 'Deskripsi dalam bahasa Indonesia');

-- Add room translation
INSERT INTO "room_translations" (room_id, language_code, title, description)
VALUES (49, 'id', 'Kamar Baru', 'Deskripsi kamar dalam bahasa Indonesia');
```

### **Updating Translations**

```sql
UPDATE "homestay_translations" 
SET title = 'Judul Baru', description = 'Deskripsi yang diperbarui'
WHERE homestay_id = 1 AND language_code = 'id';
```

## 🔍 Troubleshooting

### **Common Issues:**

1. **"Translation tables don't exist"**
   - Run the migration script: `npx ts-node src/scripts/run-translation-migration.ts`

2. **"No translations returned"**
   - Check if translation data exists in the database
   - Verify language code is correct ('en', 'id')

3. **"Server error on translation endpoints"**
   - Check database connection
   - Verify TypeScript compilation is successful

### **Debug Queries:**

```sql
-- Check available translations
SELECT * FROM "homestay_translations" WHERE language_code = 'id';
SELECT * FROM "room_translations" WHERE language_code = 'id';

-- Count translations by language
SELECT language_code, COUNT(*) 
FROM "homestay_translations" 
GROUP BY language_code;
```

## ✅ Verification Checklist

- [ ] Database migration completed successfully
- [ ] Translation tables exist with proper constraints
- [ ] Sample translation data is inserted
- [ ] API endpoints accept `lang` parameter
- [ ] English responses work correctly
- [ ] Indonesian responses work correctly
- [ ] Invalid language codes fallback to English
- [ ] Existing functionality remains unaffected

## 🎯 Next Steps

1. **Frontend Integration**: Update frontend to send `lang` parameter
2. **Admin Interface**: Create admin panel for managing translations
3. **Bulk Operations**: Add endpoints for bulk translation management
4. **Performance Optimization**: Implement caching for translations
5. **Content Validation**: Add validation for translation completeness

---

## 📞 Support

If you encounter any issues with the multilingual implementation, refer to this guide or check the test scripts for debugging assistance. 