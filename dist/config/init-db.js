"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const initDatabase = async () => {
    try {
        // Read the main SQL file
        const mainSqlFile = path_1.default.join(__dirname, 'database.sql');
        const mainSql = fs_1.default.readFileSync(mainSqlFile, 'utf8');
        // Read the payment SQL file
        const paymentSqlFile = path_1.default.join(__dirname, 'payment.sql');
        const paymentSql = fs_1.default.readFileSync(paymentSqlFile, 'utf8');
        // Combine SQL statements
        const allSql = mainSql + '\n' + paymentSql;
        // Split the SQL file into individual statements
        const statements = allSql
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);
        // Execute each statement
        for (const statement of statements) {
            await database_1.pool.query(statement);
            console.log('Executed SQL statement successfully');
        }
        console.log('Database initialization completed successfully');
    }
    catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};
// Run the initialization if this file is executed directly
if (require.main === module) {
    initDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = initDatabase;
