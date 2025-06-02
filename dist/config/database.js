"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DB_CONNECTION_STRING;
const pool = new pg_1.Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false // Required for Supabase
    },
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 10000, // How long to wait for a connection (increased to 10 seconds)
    query_timeout: 60000, // Query timeout (60 seconds)
    statement_timeout: 60000, // Statement timeout (60 seconds)
});
exports.pool = pool;
// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connection successful!');
        client.release();
        return true;
    }
    catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
