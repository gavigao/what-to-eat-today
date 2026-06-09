# 🍽️ 今天吃什么

个人饮食管理 Web App —— 记录每日三餐、零食饮料，自动估算热量与三大营养素，可视化仪表盘 + AI 饮食建议。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS v3 + Recharts |
| 后端 | Node.js 20 + Express 4 |
| 数据库 | MySQL 8 |
| AI | DeepSeek API |

## 功能特性

- 📝 **今日记录**：按餐次记录食物，支持搜索食物库、AI 估算未知食物，份量选择（少量/半份/一份/多份）
- 📊 **饮食仪表盘**：热量进度条、三大营养素饼图、三餐时间轴、近7天趋势图、AI 饮食建议
- 📅 **历史记录**：按月查看历史饮食，展开详情，月度统计摘要

## 本地运行

### 前提

- Node.js 20+
- MySQL 8+
- DeepSeek API Key（[申请地址](https://platform.deepseek.com/)）

### 启动步骤

```bash
# 1. 进入项目目录
cd what-to-eat-today

# 2. 配置后端环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入你的 MySQL 密码和 DeepSeek API Key

# 3. 创建数据库并执行建表
mysql -u root -p < backend/schema.sql

# 4. 导入种子数据（60+ 种食物）
cd backend && npm run seed && cd ..

# 5. 启动后端（端口 3001）
cd backend && npm run dev &

# 6. 启动前端（端口 5173）
cd frontend && npm run dev &

# 7. 浏览器打开
# http://localhost:5173
```

## 项目结构

```
what-to-eat-today/
├── frontend/                # React 前端
│   └── src/
│       ├── api/index.js     # API 请求封装
│       ├── components/      # 可复用组件
│       ├── pages/           # 页面
│       ├── App.jsx          # 路由 + 布局
│       └── main.jsx         # 入口
├── backend/                 # Express 后端
│   └── src/
│       ├── controllers/     # 控制器
│       ├── routes/          # 路由
│       ├── db/index.js      # MySQL 连接池
│       └── app.js           # 入口
├── schema.sql               # 建表语句
├── seeds/                   # 种子数据
└── .env.example             # 环境变量模板
```

## 后续优化方向

### 🔜 短期（核心体验）
- **多用户支持**：注册/登录系统，用户数据隔离（已预留 user_id 字段）
- **PWA 离线支持**：添加到手机主屏幕，断网也能记录

### 📅 中期（智能化）
- **AI 拍照识别**：拍张照片自动识别食物并估算营养
- **饮食推荐引擎**：根据历史记录和个人目标，推荐今日吃什么
- **体重趋势图**：可视化体重变化曲线，关联饮食数据分析

### 🚀 长期（生态化）
- **社区食谱分享**：用户分享自己的健康食谱
- **饮食挑战**：设定目标（如"一周不吃糖"），打卡追踪
- **微信小程序版**：手机端更轻量的使用方式
- **家庭成员模式**：一个家庭共享食物库，分别追踪各自饮食
