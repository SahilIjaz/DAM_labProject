import { executeQuery } from '../db/mysql';
import { cacheGet, cacheSet, cacheDel } from '../db/redis';
import crypto from 'crypto';

export interface ShareLink {
  link_id: string;
  user_id: number;
  data_type: string; // 'student', 'course', 'exam', 'grade', 'report', 'enrollment'
  data_id: string; // ID of the shared data
  link_code: string; // Unique short code
  access_level: 'view' | 'edit' | 'comment'; // Permission level
  expires_at?: Date;
  max_views?: number;
  view_count: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SharedData {
  link_code: string;
  data_type: string;
  data: any;
  access_level: string;
  created_by: number;
  view_count: number;
  is_public: boolean;
}

// Generate unique short link code
function generateLinkCode(): string {
  return crypto.randomBytes(6).toString('hex').substring(0, 8);
}

// Create a shareable link
export async function createShareLink(
  userId: number,
  dataType: string,
  dataId: string,
  accessLevel: 'view' | 'edit' | 'comment' = 'view',
  expiresAt?: Date,
  maxViews?: number,
  isPublic: boolean = false
): Promise<ShareLink | null> {
  try {
    const linkCode = generateLinkCode();
    const linkId = `link_${crypto.randomUUID()}`;

    const query = `
      INSERT INTO share_links
      (link_id, user_id, data_type, data_id, link_code, access_level, expires_at, max_views, is_public, view_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await executeQuery(query, [
      linkId,
      userId,
      dataType,
      dataId,
      linkCode,
      accessLevel,
      expiresAt || null,
      maxViews || null,
      isPublic ? 1 : 0,
      0,
    ]);

    // Cache the link for quick access
    await cacheSet(
      `link:${linkCode}`,
      JSON.stringify({ linkId, userId, dataType, dataId, accessLevel, isPublic }),
      86400 // 24 hours
    );

    return {
      link_id: linkId,
      user_id: userId,
      data_type: dataType,
      data_id: dataId,
      link_code: linkCode,
      access_level: accessLevel,
      expires_at: expiresAt,
      max_views: maxViews,
      view_count: 0,
      is_public: isPublic,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error('Error creating share link:', error);
    return null;
  }
}

// Get link details by code
export async function getShareLinkByCode(linkCode: string): Promise<ShareLink | null> {
  try {
    // Check cache first
    const cached = await cacheGet(`link:${linkCode}`);
    if (cached) {
      const data = JSON.parse(cached);
      return data;
    }

    // Query database
    const links = await executeQuery<ShareLink>(
      `SELECT * FROM share_links WHERE link_code = ? AND (expires_at IS NULL OR expires_at > NOW())`,
      [linkCode]
    );

    if (links.length === 0) return null;

    const link = links[0];

    // Check max views
    if (link.max_views && link.view_count >= link.max_views) {
      return null;
    }

    // Cache the result
    await cacheSet(`link:${linkCode}`, JSON.stringify(link), 3600);

    return link;
  } catch (error) {
    console.error('Error fetching share link:', error);
    return null;
  }
}

// Get all links created by a user
export async function getUserShareLinks(userId: number): Promise<ShareLink[]> {
  try {
    const cacheKey = `user:${userId}:links`;

    // Check cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const links = await executeQuery<ShareLink>(
      `SELECT * FROM share_links WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    // Cache for 1 hour
    await cacheSet(cacheKey, JSON.stringify(links), 3600);

    return links;
  } catch (error) {
    console.error('Error fetching user share links:', error);
    return [];
  }
}

// Increment view count
export async function incrementLinkViews(linkCode: string): Promise<void> {
  try {
    await executeQuery(
      `UPDATE share_links SET view_count = view_count + 1, updated_at = NOW() WHERE link_code = ?`,
      [linkCode]
    );

    // Invalidate cache
    await cacheDel(`link:${linkCode}`);
  } catch (error) {
    console.error('Error incrementing link views:', error);
  }
}

// Delete a share link
export async function deleteShareLink(linkId: string): Promise<boolean> {
  try {
    const link = await executeQuery<{ link_code: string }>(
      `SELECT link_code FROM share_links WHERE link_id = ?`,
      [linkId]
    );

    if (link.length === 0) return false;

    await executeQuery(`DELETE FROM share_links WHERE link_id = ?`, [linkId]);

    // Invalidate cache
    await cacheDel(`link:${link[0].link_code}`);

    return true;
  } catch (error) {
    console.error('Error deleting share link:', error);
    return false;
  }
}

// Get shared data by link code
export async function getSharedData(linkCode: string): Promise<SharedData | null> {
  try {
    const link = await getShareLinkByCode(linkCode);
    if (!link) return null;

    let data = null;

    // Fetch actual data based on type
    switch (link.data_type) {
      case 'student':
        const students = await executeQuery(
          `SELECT * FROM students WHERE student_id = ?`,
          [link.data_id]
        );
        data = students[0] || null;
        break;

      case 'course':
        const courses = await executeQuery(
          `SELECT * FROM courses WHERE course_id = ?`,
          [link.data_id]
        );
        data = courses[0] || null;
        break;

      case 'exam':
        const exams = await executeQuery(
          `SELECT * FROM exams WHERE exam_id = ?`,
          [link.data_id]
        );
        data = exams[0] || null;
        break;

      case 'grade':
        const grades = await executeQuery(
          `SELECT * FROM grades WHERE grade_id = ?`,
          [link.data_id]
        );
        data = grades[0] || null;
        break;

      case 'enrollment':
        const enrollments = await executeQuery(
          `SELECT * FROM enrollments WHERE enrollment_id = ?`,
          [link.data_id]
        );
        data = enrollments[0] || null;
        break;

      case 'report':
        const reports = await executeQuery(
          `SELECT * FROM reports WHERE report_id = ?`,
          [link.data_id]
        );
        data = reports[0] || null;
        break;
    }

    if (!data) return null;

    // Increment view count
    await incrementLinkViews(linkCode);

    return {
      link_code: linkCode,
      data_type: link.data_type,
      data,
      access_level: link.access_level,
      created_by: link.user_id,
      view_count: link.view_count + 1,
      is_public: link.is_public,
    };
  } catch (error) {
    console.error('Error getting shared data:', error);
    return null;
  }
}

// Update link access level
export async function updateShareLinkAccess(
  linkId: string,
  accessLevel: 'view' | 'edit' | 'comment'
): Promise<boolean> {
  try {
    const link = await executeQuery<{ link_code: string }>(
      `SELECT link_code FROM share_links WHERE link_id = ?`,
      [linkId]
    );

    if (link.length === 0) return false;

    await executeQuery(
      `UPDATE share_links SET access_level = ?, updated_at = NOW() WHERE link_id = ?`,
      [accessLevel, linkId]
    );

    // Invalidate cache
    await cacheDel(`link:${link[0].link_code}`);

    return true;
  } catch (error) {
    console.error('Error updating share link access:', error);
    return false;
  }
}

// Revoke link (set expiration to now)
export async function revokeShareLink(linkId: string): Promise<boolean> {
  try {
    const link = await executeQuery<{ link_code: string }>(
      `SELECT link_code FROM share_links WHERE link_id = ?`,
      [linkId]
    );

    if (link.length === 0) return false;

    await executeQuery(
      `UPDATE share_links SET expires_at = NOW(), updated_at = NOW() WHERE link_id = ?`,
      [linkId]
    );

    // Invalidate cache
    await cacheDel(`link:${link[0].link_code}`);

    return true;
  } catch (error) {
    console.error('Error revoking share link:', error);
    return false;
  }
}

// Get analytics for a shared link
export async function getLinkAnalytics(linkId: string): Promise<any | null> {
  try {
    const links = await executeQuery<any>(
      `SELECT link_id, link_code, created_at, view_count, max_views, access_level, is_public
       FROM share_links WHERE link_id = ?`,
      [linkId]
    );

    if (links.length === 0) return null;

    const link = links[0];

    return {
      link_code: link.link_code,
      created_at: link.created_at,
      total_views: link.view_count,
      max_views: link.max_views,
      view_percentage: link.max_views ? (link.view_count / link.max_views) * 100 : null,
      access_level: link.access_level,
      is_public: link.is_public,
    };
  } catch (error) {
    console.error('Error getting link analytics:', error);
    return null;
  }
}
