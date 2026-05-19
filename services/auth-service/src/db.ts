import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'university_main',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function executeQuery<T>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results as T[];
  } finally {
    connection.release();
  }
}

export async function closePool() {
  return pool.end();
}

export default pool;
