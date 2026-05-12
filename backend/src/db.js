const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

db.execute = (sql, params = []) => {
    let counter = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++counter}`);
    return db.query(pgSql, params).then(res => [res.rows, res]);
};

module.exports = db;