# 🍽️ 今天吃什么

个人饮食管理 Web App —— 记录每日三餐、零食饮料，自动估算热量与三大营养素，可视化仪表盘 + AI 饮食建议。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + Vite 8 + Tailwind CSS v3 + Recharts |
| 后端 | Node.js 20 + Express 4 |
| 数据库 | MySQL 8 |
| AI | DeepSeek API（兼容 OpenAI 格式） |
| 图标 | lucide-react |

## 功能特性

- 🔐 **多用户系统**：邀请码注册 + JWT 双 Token 认证，个人数据完全隔离
- 📝 **今日记录**：按餐次记录食物，支持搜索食物库（60+ 种预置数据）、AI 估算未知食物、份量选择（少量/半份/一份/多份/自定义克数）
- 📊 **饮食仪表盘**：热量进度条（支持个性化目标）、三大营养素饼图、三餐时间轴、近 7 天热量趋势图、AI 饮食分析与智能推荐
- 📅 **历史记录**：按月查看历史饮食，展开查看每日详情，月度统计摘要（记录天数、平均热量、最高热量）
- 👤 **个人画像**：性别 / 年龄 / 身高 / 体重 / 活动水平 / 饮食目标，基于 Mifflin-St Jeor 公式自动计算 TDEE 和个性化热量目标
- ⚖️ **体重追踪**：每日体重日志，可视化趋势曲线
- 👨‍👩‍👧 **家庭模式**：6 位配对码创建/加入家庭，查看家人的当日饮食记录（数据仅共享指定餐次，不泄露详细营养数据）
- 🤖 **AI 智能分析**：基于个人画像 + 当日饮食的个性化营养分析（含智能缓存，饮食无变动不重复调用）
- 🛡️ **管理后台**：用户列表管理、邀请码生成与停用、AI 调用配额控制
- 📱 **响应式设计**：移动端底部毛玻璃导航 + 桌面端侧边栏

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

### Windows 一键启动

双击项目根目录的 `start.bat`，自动启动前后端。

### 生产部署

```bash
# Ubuntu 22.04 一键部署（Nginx + PM2）
bash deploy.sh <your_deepseek_api_key>
```

首次部署后，使用默认管理员账号登录：`admin` / `admin123`（登录后请立即修改密码）。

## 项目结构

```
what-to-eat-today/
├── frontend/                          # React 前端
│   └── src/
│       ├── api/                       # API 请求封装
│       │   ├── index.js               # axios 实例 + 401 自动刷新
│       │   ├── auth.js                # 认证接口
│       │   ├── admin.js               # 管理接口
│       │   └── family.js              # 家庭接口
│       ├── components/                # 可复用组件（11 个）
│       │   ├── AiAdvicePanel.jsx      # AI 饮食建议面板
│       │   ├── AiRecommendPanel.jsx   # AI 今日推荐面板
│       │   ├── CalorieBar.jsx         # 热量进度条
│       │   ├── FoodSearch.jsx         # 食物搜索（含 AI fallback）
│       │   ├── MacroPieChart.jsx      # 三大营养素饼图
│       │   ├── MealCard.jsx           # 餐次卡片
│       │   ├── MealTimeline.jsx       # 三餐时间轴
│       │   ├── PortionSelector.jsx    # 份量选择器
│       │   ├── ProtectedRoute.jsx     # 路由守卫
│       │   ├── TrendChart.jsx         # 热量趋势图
│       │   └── WeightTrendChart.jsx   # 体重趋势图
│       ├── context/AuthContext.jsx     # 全局认证状态
│       ├── pages/                     # 页面（8 个）
│       │   ├── TodayPage.jsx          # 今日记录（主页）
│       │   ├── DashboardPage.jsx      # 饮食仪表盘
│       │   ├── HistoryPage.jsx        # 历史记录
│       │   ├── ProfilePage.jsx        # 个人画像 + 体重趋势
│       │   ├── FamilyPage.jsx         # 家庭管理
│       │   ├── AdminPage.jsx          # 管理后台
│       │   ├── LoginPage.jsx          # 登录
│       │   └── RegisterPage.jsx       # 注册
│       ├── App.jsx                    # 路由 + 响应式布局
│       └── main.jsx                   # 入口
├── backend/                           # Express 后端
│   └── src/
│       ├── controllers/               # 控制器（7 个）
│       │   ├── authController.js      # 注册/登录/刷新/登出/改密
│       │   ├── foodsController.js     # 食物搜索/分类/自定义
│       │   ├── mealsController.js     # 饮食记录 CRUD + 汇总/趋势/月度
│       │   ├── aiController.js        # AI 分析/估算/推荐
│       │   ├── profileController.js   # 个人画像 + TDEE 计算
│       │   ├── familyController.js    # 家庭创建/加入/退出/成员查看
│       │   └── adminController.js     # 管理后台
│       ├── routes/                    # 路由定义（7 个模块）
│       ├── middleware/                # 中间件
│       │   ├── auth.js                # JWT 认证
│       │   ├── admin.js               # 管理员权限
│       │   └── aiQuota.js             # AI 调用配额
│       ├── config/auth.js             # JWT 密钥配置
│       ├── db/index.js                # MySQL 连接池
│       └── app.js                     # Express 入口
│   ├── seeds/foods_seed.js            # 60+ 种预置食物数据
│   ├── schema.sql                     # 完整建表语句
│   └── migrations/001_multi_user.sql  # 多用户迁移 SQL
├── deploy.sh                          # Ubuntu 一键部署脚本（Nginx + PM2）
├── start.bat                          # Windows 一键启动脚本
└── .env.example                       # 环境变量模板
```

## 优化路线图

### 🔜 短期
- ✅ 多用户支持：注册/登录系统，用户数据隔离
- ❌ PWA 离线支持：添加到手机主屏幕，断网也能记录
- ✅ 家庭成员模式：配对码加入家庭，多人饮食互相查看

### 📅 中期
- ✅ AI 饮食推荐引擎：根据营养缺口和饮食历史，智能推荐每餐吃什么
- ✅ 体重趋势图：可视化体重变化曲线，关联饮食数据分析
- ❌ AI 拍照识别：拍张照片自动识别食物并估算营养

### 🚀 长期
- ❌ 社区食谱分享：用户分享自己的健康食谱
- ❌ 饮食挑战：设定目标（如"一周不吃糖"），打卡追踪
- ❌ 微信小程序版：手机端更轻量的使用方式

## 邀请码机制

注册必须使用管理员生成的邀请码（防滥用）。管理员在后台生成邀请码后分享给家人或朋友，每个邀请码可设置使用次数上限和有效期。

## 许可

MIT
