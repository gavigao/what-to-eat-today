-- 创建数据库
CREATE DATABASE IF NOT EXISTS what_to_eat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE what_to_eat;

-- 食物库（预置 + 用户自定义）
CREATE TABLE IF NOT EXISTS foods (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  category    ENUM('主食','肉类','海鲜','蛋奶','蔬菜','水果','豆制品','坚果','零食','饮料','其他') NOT NULL,
  calories    FLOAT NOT NULL COMMENT '每100g/ml热量(kcal)',
  protein     FLOAT NOT NULL COMMENT '蛋白质(g)',
  carbs       FLOAT NOT NULL COMMENT '碳水化合物(g)',
  fat         FLOAT NOT NULL COMMENT '脂肪(g)',
  unit        ENUM('g','ml') NOT NULL DEFAULT 'g',
  is_custom   TINYINT(1) DEFAULT 0 COMMENT '0=预置 1=用户自定义',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 饮食记录
CREATE TABLE IF NOT EXISTS meals (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL DEFAULT 1 COMMENT '预留多用户字段，当前默认1',
  date         DATE NOT NULL COMMENT '记录日期',
  meal_type    ENUM('早餐','午餐','晚餐','点心','零食','饮料') NOT NULL,
  food_id      INT COMMENT '关联foods表，NULL表示AI估算的自定义食物',
  food_name    VARCHAR(100) NOT NULL COMMENT '食物名称（冗余存储）',
  portion_size ENUM('少量','半份','一份','多份') NOT NULL DEFAULT '一份',
  calories     FLOAT NOT NULL COMMENT '本条记录实际热量',
  protein      FLOAT NOT NULL,
  carbs        FLOAT NOT NULL,
  fat          FLOAT NOT NULL,
  notes        VARCHAR(255) DEFAULT NULL COMMENT '备注',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
);

-- AI 分析记录（每天最多存一条，重新分析则覆盖）
CREATE TABLE IF NOT EXISTS ai_analyses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL DEFAULT 1,
  date        DATE NOT NULL,
  analysis    TEXT NOT NULL COMMENT 'AI分析内容',
  suggestions TEXT NOT NULL COMMENT 'AI建议',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, date)
);

-- 个人画像（每用户一条记录）
CREATE TABLE IF NOT EXISTS user_profiles (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL DEFAULT 1 UNIQUE COMMENT '预留多用户字段',
  gender         ENUM('男','女') NOT NULL,
  age            INT NOT NULL COMMENT '年龄',
  height         FLOAT NOT NULL COMMENT '身高(cm)',
  weight         FLOAT NOT NULL COMMENT '当前体重(kg)',
  activity_level ENUM('久坐','轻度活动','中度活动','重度活动','运动员') NOT NULL DEFAULT '久坐',
  goal           ENUM('减脂','维持体重','增肌') NOT NULL DEFAULT '维持体重',
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 体重日志（追踪体重变化）
CREATE TABLE IF NOT EXISTS weight_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL DEFAULT 1,
  date       DATE NOT NULL,
  weight     FLOAT NOT NULL COMMENT '体重(kg)',
  notes      VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, date)
);
