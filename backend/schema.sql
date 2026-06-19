-- 创建数据库
CREATE DATABASE IF NOT EXISTS what_to_eat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE what_to_eat;

-- ===== 用户系统 =====

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  email         VARCHAR(100) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 邀请码表
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

-- AI 调用配额表（每人每天一条记录）
CREATE TABLE IF NOT EXISTS ai_usage (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  usage_date DATE NOT NULL,
  count      INT NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_date (user_id, usage_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 家庭表
CREATE TABLE IF NOT EXISTS families (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  pairing_code VARCHAR(6) NOT NULL UNIQUE,
  created_by   INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 家庭成员表
CREATE TABLE IF NOT EXISTS family_members (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  user_id   INT NOT NULL,
  role      ENUM('owner','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_family_user (family_id, user_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== 业务表 =====

-- 食物库（预置 + 用户自定义）
CREATE TABLE IF NOT EXISTS foods (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(20) NOT NULL COMMENT '食物分类',
  calories    FLOAT NOT NULL COMMENT '每100g/ml热量(kcal)',
  protein     FLOAT NOT NULL COMMENT '蛋白质(g)',
  carbs       FLOAT NOT NULL COMMENT '碳水化合物(g)',
  fat         FLOAT NOT NULL COMMENT '脂肪(g)',
  unit        VARCHAR(10) NOT NULL DEFAULT 'g' COMMENT '单位 g/ml',
  is_custom   TINYINT(1) DEFAULT 0 COMMENT '0=预置 1=用户自定义',
  serving_size DECIMAL(10,2) DEFAULT NULL COMMENT '一份的重量(g)或体积(ml)',
  serving_desc VARCHAR(50) DEFAULT NULL COMMENT '一份的描述，如"1个(约50g)"',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 饮食记录
CREATE TABLE IF NOT EXISTS meals (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL COMMENT '用户ID',
  date         DATE NOT NULL COMMENT '记录日期',
  meal_type    VARCHAR(10) NOT NULL COMMENT '餐次类型',
  food_id      INT COMMENT '关联foods表，NULL表示AI估算的自定义食物',
  food_name    VARCHAR(100) NOT NULL COMMENT '食物名称（冗余存储）',
  portion_size VARCHAR(10) NOT NULL DEFAULT '一份' COMMENT '份量',
  calories     FLOAT NOT NULL COMMENT '本条记录实际热量',
  protein      FLOAT NOT NULL,
  carbs        FLOAT NOT NULL,
  fat          FLOAT NOT NULL,
  notes        VARCHAR(255) DEFAULT NULL COMMENT '备注',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
);

-- AI 分析记录（每天每用户最多存一条，重新分析则覆盖）
CREATE TABLE IF NOT EXISTS ai_analyses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  date        DATE NOT NULL,
  analysis    TEXT NOT NULL COMMENT 'AI分析内容',
  suggestions TEXT NOT NULL COMMENT 'AI建议',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, date)
);

-- 个人画像（每用户一条记录）
CREATE TABLE IF NOT EXISTS user_profiles (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL UNIQUE,
  gender         VARCHAR(5) NOT NULL COMMENT '性别',
  age            INT NOT NULL COMMENT '年龄',
  height         FLOAT NOT NULL COMMENT '身高(cm)',
  weight         FLOAT NOT NULL COMMENT '当前体重(kg)',
  activity_level VARCHAR(10) NOT NULL DEFAULT '久坐' COMMENT '活动水平',
  goal           VARCHAR(10) NOT NULL DEFAULT '维持体重' COMMENT '饮食目标',
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 体重日志（追踪体重变化）
CREATE TABLE IF NOT EXISTS weight_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  date       DATE NOT NULL,
  weight     FLOAT NOT NULL COMMENT '体重(kg)',
  notes      VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, date)
);
