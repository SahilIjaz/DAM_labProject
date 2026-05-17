import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'university_main',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  multipleStatements: false,
});

export async function executeQuery<T = any>(
  query: string,
  values?: any[]
): Promise<T[]> {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(query, values);
    return (results as T[]) || [];
  } finally {
    connection.release();
  }
}

export async function executeTransaction<T = any>(
  callback: (connection: any) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function callProcedure(
  procedureName: string,
  parameters: any[] = [],
  outParamCount: number = 2
): Promise<any> {
  const connection = await pool.getConnection();
  try {
    const allParams = [...parameters];
    for (let i = 0; i < outParamCount; i++) {
      allParams.push(null);
    }

    const placeholders = allParams.map(() => '?').join(',');
    const query = `CALL ${procedureName}(${placeholders})`;
    const [results] = await connection.execute(query, allParams) as any[];

    if (Array.isArray(results) && results.length > 0) {
      const row = results[0] as any;
      return {
        user_id: row.p_user_id || row['@p_user_id'],
        status: row.p_error_message || row['@p_error_message'] || 'success',
        message: row.p_error_message || row['@p_error_message']
      };
    }

    return results;
  } finally {
    connection.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
