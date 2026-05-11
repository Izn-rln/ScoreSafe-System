const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Helper to make pg work like mysql2 execute
db.execute = (sql, params) => {
    const pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
    return db.query(pgSql, params).then(res => [res.rows, res]);
};

module.exports = db;