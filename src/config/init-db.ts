import { pool } from './database';
import fs from 'fs';
import path from 'path';

const initDatabase = async () => {
  try {
    // Read the main SQL file
    const mainSqlFile = path.join(__dirname, 'database.sql');
    const mainSql = fs.readFileSync(mainSqlFile, 'utf8');

    // Read the payment SQL file
    const paymentSqlFile = path.join(__dirname, 'payment.sql');
    const paymentSql = fs.readFileSync(paymentSqlFile, 'utf8');

    // Combine SQL statements
    const allSql = mainSql + '\n' + paymentSql;

    // Split the SQL file into individual statements
    const statements = allSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await pool.query(statement);
      console.log('Executed SQL statement successfully');
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
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

export default initDatabase; 