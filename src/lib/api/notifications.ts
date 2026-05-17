import { executeQuery } from '../db/mysql';

export async function createNotification(userId: number, title: string, message: string, type: string) {
  const query = `
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (?, ?, ?, ?, false)
  `;
  return executeQuery(query, [userId, title, message, type]);
}

export async function getUserNotifications(userId: number, limit = 20) {
  const query = `
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `;
  return executeQuery(query, [userId, limit]);
}

export async function markNotificationAsRead(notificationId: number) {
  const query = `UPDATE notifications SET is_read = true WHERE notification_id = ?`;
  return executeQuery(query, [notificationId]);
}

export async function deleteNotification(notificationId: number) {
  const query = `DELETE FROM notifications WHERE notification_id = ?`;
  return executeQuery(query, [notificationId]);
}

export async function sendBulkNotification(userIds: number[], title: string, message: string, type: string) {
  const placeholders = userIds.map(() => '(?, ?, ?, ?, false)').join(',');
  const values = userIds.flatMap(id => [id, title, message, type]);
  const query = `
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES ${placeholders}
  `;
  return executeQuery(query, values);
}
