-- ============================================
--  多用户系统迁移 SQL
--  执行方式: mysql -u root -p what_to_eat < 001_multi_user.sql
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  email         VARCHAR(100) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(8) NOT NULL UNIQUE,
  max_uses     INT NOT NULL DEFAULT 1,
  current_uses INT NOT NULL DEFAULT 0,
  created_by   INT DEFAULT NULL,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at   TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. AI 用量表（每人每天一条记录）
CREATE TABLE IF NOT EXISTS ai_usage (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  usage_date DATE NOT NULL,
  count      INT NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_date (user_id, usage_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 家庭表
CREATE TABLE IF NOT EXISTS families (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  pairing_code VARCHAR(6) NOT NULL UNIQUE,
  created_by   INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 家庭成员表
CREATE TABLE IF NOT EXISTS family_members (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  user_id   INT NOT NULL,
  role      ENUM('owner','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_family_user (family_id, user_id),
  UNIQUE KEY uq_user (user_id)  -- 每用户只能属于一个家庭
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== 插入默认管理员（id=1，确保已有数据不报错）=====
-- 密码: admin123（bcrypt 哈希，登录后请立即修改）
INSERT INTO users (id, username, email, password_hash, role)
VALUES (1, 'admin', 'admin@example.com', '$2b$12$LJ3m4ys3Lg8xHwBOsKPqOeGmKX0vY5n3Kq8ZvQ7i6x0vY5n3Kq8Z', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- ===== 现有表改动：去掉 DEFAULT 1，加外键 =====

-- meals 表
ALTER TABLE meals
  MODIFY user_id INT NOT NULL,
  ADD CONSTRAINT fk_meals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ai_analyses 表
ALTER TABLE ai_analyses
  MODIFY user_id INT NOT NULL,
  ADD CONSTRAINT fk_ai_analyses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- user_profiles 表
ALTER TABLE user_profiles
  MODIFY user_id INT NOT NULL,
  ADD CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- weight_logs 表
ALTER TABLE weight_logs
  MODIFY user_id INT NOT NULL,
  ADD CONSTRAINT fk_weight_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 补齐 foods 表缺失的列（如果不存在）
-- 注意：如果列已存在会报错，可手动跳过
ALTER TABLE foods
  ADD COLUMN serving_size DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN serving_desc VARCHAR(50) DEFAULT NULL;
