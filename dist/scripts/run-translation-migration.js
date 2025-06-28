"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTranslationMigration = runTranslationMigration;
const database_1 = require("../config/database");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runTranslationMigration() {
    console.log('🚀 Starting translation tables migration...');
    try {
        // Read and execute the main migration file
        const migrationPath = path.join(__dirname, '../database/migrations/add_translation_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log('📝 Creating translation tables...');
        await database_1.pool.query(migrationSQL);
        console.log('✅ Translation tables created successfully!');
        // Read and execute sample data (optional)
        const sampleDataPath = path.join(__dirname, '../database/migrations/add_sample_translations.sql');
        if (fs.existsSync(sampleDataPath)) {
            const sampleDataSQL = fs.readFileSync(sampleDataPath, 'utf8');
            console.log('📝 Adding sample translation data...');
            try {
                await database_1.pool.query(sampleDataSQL);
                console.log('✅ Sample translation data added successfully!');
            }
            catch (error) {
                console.log('⚠️  Sample data insertion failed (this is normal if data already exists):', error.message);
            }
        }
        // Verify migration success
        console.log('🔍 Verifying migration...');
        const verificationQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('homestay_translations', 'room_translations')
      AND table_schema = 'public';
    `;
        const { rows: tables } = await database_1.pool.query(verificationQuery);
        console.log('📊 Created tables:', tables.map(t => t.table_name));
        // Check translation counts
        const { rows: [homestayCount] } = await database_1.pool.query('SELECT COUNT(*) as count FROM "homestay_translations"');
        const { rows: [roomCount] } = await database_1.pool.query('SELECT COUNT(*) as count FROM "room_translations"');
        console.log(`📈 Translation records created:`);
        console.log(`   - Homestay translations: ${homestayCount.count}`);
        console.log(`   - Room translations: ${roomCount.count}`);
        console.log('🎉 Translation migration completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}
// Run migration if this file is executed directly
if (require.main === module) {
    runTranslationMigration()
        .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
