import { executeQuery } from '../db/mysql';

export async function getDepartments(): Promise<any[]> {
  const query = `SELECT * FROM departments ORDER BY department_id`;
  return executeQuery(query, []);
}

export async function getDepartmentById(departmentId: number): Promise<any | null> {
  const query = `SELECT * FROM departments WHERE department_id = ?`;
  const results = await executeQuery(query, [departmentId]);
  return results[0] || null;
}
