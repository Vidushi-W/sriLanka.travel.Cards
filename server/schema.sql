CREATE TABLE IF NOT EXISTS administrators (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  admin_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES administrators(id) ON DELETE CASCADE,
  INDEX (expires_at)
);
CREATE TABLE IF NOT EXISTS website_pages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  published_slug VARCHAR(180) UNIQUE,
  published_title VARCHAR(200),
  published_at DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS website_sections (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  page_id BIGINT UNSIGNED NOT NULL,
  revision ENUM('draft','published') NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  kind ENUM('hero','nature','story','destinations','media','wellness','footer') NOT NULL,
  position INT NOT NULL,
  content JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES website_pages(id) ON DELETE CASCADE,
  UNIQUE KEY (page_id, revision, section_key)
);
CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  path VARCHAR(255) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES administrators(id) ON DELETE SET NULL
);
-- Typed content remains together in each atomic page revision. These views make
-- each requested content category directly queryable without duplicating data.
CREATE OR REPLACE VIEW hero_content AS SELECT * FROM website_sections WHERE kind = 'hero';
CREATE OR REPLACE VIEW experience_cards AS SELECT * FROM website_sections WHERE kind = 'nature';
CREATE OR REPLACE VIEW destination_information AS SELECT * FROM website_sections WHERE kind = 'destinations';
CREATE OR REPLACE VIEW gallery_and_video AS SELECT * FROM website_sections WHERE kind = 'media';
CREATE OR REPLACE VIEW wellness_experiences AS SELECT * FROM website_sections WHERE kind = 'wellness';
CREATE OR REPLACE VIEW footer_information AS SELECT * FROM website_sections WHERE kind = 'footer';
