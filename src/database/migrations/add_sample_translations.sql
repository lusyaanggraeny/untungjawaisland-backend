-- Sample Indonesian Translations
-- This file adds Indonesian ('id') translations for existing homestays and rooms

-- Sample homestay translations (Indonesian)
INSERT INTO "homestay_translations" (homestay_id, language_code, title, description) VALUES
(1, 'id', 'Rumah Pantai Nyaman', 'Homestay tepi pantai yang indah dengan pemandangan laut menakjubkan dan fasilitas lengkap untuk liburan yang tak terlupakan.'),
(2, 'id', 'Villa Surga Pulau', 'Villa mewah dengan fasilitas modern, kolam renang pribadi, dan akses langsung ke pantai. Cocok untuk keluarga dan kelompok besar.'),
(3, 'id', 'Pondok Nelayan Tradisional', 'Pengalaman menginap autentik di rumah nelayan tradisional dengan suasana khas pulau dan makanan laut segar setiap hari.'),
(4, 'id', 'Rumah Kayu Tropis', 'Bangunan kayu tradisional dengan arsitektur tropis yang asri, dikelilingi taman hijau dan dekat dengan pusat aktivitas wisata.'),
(5, 'id', 'Penginapan Keluarga Bahari', 'Homestay ramah keluarga dengan kamar-kamar nyaman, area bermain anak, dan lokasi strategis dekat pelabuhan.'),
-- Add more as needed based on your actual homestay IDs
(49, 'id', 'Homestay Pulau Untung Jawa', 'Penginapan nyaman di Pulau Untung Jawa dengan fasilitas lengkap dan pemandangan laut yang menawan. Ideal untuk liburan keluarga dan backpacker.');

-- Sample room translations (Indonesian) 
-- Note: Replace room IDs with actual IDs from your database
INSERT INTO "room_translations" (room_id, language_code, title, description) VALUES
(49, 'id', 'Kamar Deluxe', 'Kamar deluxe yang luas dengan fasilitas premium, AC, TV, dan pemandangan laut yang menakjubkan. Cocok untuk 3-4 orang.'),
(50, 'id', 'Kamar Keluarga', 'Kamar keluarga besar yang sempurna untuk rombongan, dilengkapi dengan kasur besar dan area duduk yang nyaman.'),
(51, 'id', 'Kamar Standard', 'Kamar standard yang nyaman dengan fasilitas dasar lengkap. Ekonomis namun tetap bersih dan nyaman untuk menginap.'),
(52, 'id', 'Suite Keluarga', 'Suite luas dengan ruang tamu terpisah, cocok untuk keluarga besar. Dilengkapi dapur kecil dan balkon menghadap laut.'),
(53, 'id', 'Kamar Budget', 'Kamar ekonomis dengan fasilitas dasar yang bersih dan nyaman. Pilihan tepat untuk backpacker dan budget traveler.'),
(54, 'id', 'Kamar VIP', 'Kamar VIP dengan fasilitas mewah, jacuzzi pribadi, dan balkon luas dengan pemandangan sunset yang spektakuler.');

-- Add room features translations if needed (room_features table)
-- This is optional but can be useful for feature descriptions
/*
INSERT INTO "room_feature_translations" (feature_id, language_code, title, description) VALUES
(1, 'id', 'AC', 'Pendingin ruangan'),
(2, 'id', 'TV', 'Televisi LCD'),
(3, 'id', 'WiFi', 'Internet nirkabel gratis'),
(4, 'id', 'Kamar Mandi Dalam', 'Kamar mandi pribadi dengan shower'),
(5, 'id', 'Balkon', 'Balkon dengan pemandangan laut');
*/ 