"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const migrateQRISPayments = async () => {
    var _a;
    try {
        console.log('🚀 Starting QRIS payments migration...');
        // Read the migration SQL file
        const migrationFile = path_1.default.join(__dirname, '../../database/migrations/add-qris-payment-columns.sql');
        const migrationSql = fs_1.default.readFileSync(migrationFile, 'utf8');
        // Split the SQL file into individual statements
        const statements = migrationSql
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0 && !statement.startsWith('--'));
        // Execute each statement
        for (const statement of statements) {
            try {
                await database_1.pool.query(statement);
                console.log('✅ Executed migration statement successfully');
            }
            catch (error) {
                // Continue if column already exists
                if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('already exists')) {
                    console.log('⚠️  Column already exists, skipping...');
                }
                else {
                    throw error;
                }
            }
        }
        console.log('✅ QRIS payments migration completed successfully!');
        console.log('📋 Added columns:');
        console.log('   - gateway_provider');
        console.log('   - gateway_payment_id');
        console.log('   - qris_code');
        console.log('   - qris_expires_at');
        console.log('   - platform_commission');
        console.log('   - owner_payout_amount');
        console.log('   - payout_status');
        console.log('   - confirmation_deadline');
        console.log('   - manual_confirmation_required');
    }
    catch (error) {
        console.error('❌ Error running QRIS migration:', error);
        throw error;
    }
};
// Run the migration if this file is executed directly
if (require.main === module) {
    migrateQRISPayments()
        .then(() => {
        console.log('🎉 Migration completed! You can now use QRIS payments.');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
}
exports.default = migrateQRISPayments;
