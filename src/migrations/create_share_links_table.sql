-- Create share_links table for link server
CREATE TABLE IF NOT EXISTS share_links (
  link_id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- 'student', 'course', 'exam', 'grade', 'report', 'enrollment'
  data_id VARCHAR(255) NOT NULL,
  link_code VARCHAR(8) NOT NULL UNIQUE,
  access_level ENUM('view', 'edit', 'comment') DEFAULT 'view',
  expires_at TIMESTAMP NULL,
  max_views INT NULL,
  view_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_link_code (link_code),
  INDEX idx_user_id (user_id),
  INDEX idx_data_type (data_type),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at)
);

-- Create index for faster lookups
CREATE UNIQUE INDEX idx_share_link_code ON share_links(link_code);
CREATE INDEX idx_share_link_user ON share_links(user_id, created_at);
CREATE INDEX idx_share_link_data ON share_links(data_type, data_id);
