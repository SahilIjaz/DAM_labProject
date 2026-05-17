import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'university_analytics',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function executeQuery<T = any>(
  query: string,
  values?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result: QueryResult<T> = await client.query(query, values);
    return result.rows || [];
  } finally {
    client.release();
  }
}

export async function executeTransaction<T = any>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function callFunction<T = any>(
  functionName: string,
  parameters: any[] = []
): Promise<T> {
  const placeholders = parameters.map((_, i) => `$${i + 1}`).join(',');
  const query = `SELECT * FROM ${functionName}(${placeholders})`;
  const result = await executeQuery<T>(query, parameters);
  return result[0];
}

export async function insertAuditLog(
  userId: number,
  action: string,
  tableName: string,
  recordId: number,
  oldValue?: any,
  newValue?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const query = `
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING log_id;
  `;
  const values = [
    userId,
    action,
    tableName,
    recordId,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    ipAddress,
    userAgent,
  ];
  const result = await executeQuery(query, values);
  return result[0];
}

export async function logAPIRequest(
  userId: number | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  requestBody?: any,
  responseBody?: any,
  errorMessage?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const query = `
    INSERT INTO api_request_logs (user_id, endpoint, method, status_code, response_time_ms, request_body, response_body, error_message, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING request_id;
  `;
  const values = [
    userId,
    endpoint,
    method,
    statusCode,
    responseTimeMs,
    requestBody ? JSON.stringify(requestBody) : null,
    responseBody ? JSON.stringify(responseBody) : null,
    errorMessage,
    ipAddress,
    userAgent,
  ];
  const result = await executeQuery(query, values);
  return result[0];
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
