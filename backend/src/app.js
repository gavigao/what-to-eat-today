require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const foodsRoutes = require('./routes/foods');
const mealsRoutes = require('./routes/meals');
const aiRoutes = require('./routes/ai');
const profileRoutes = require('./routes/profile');
const authRoutes = require('./routes/auth');
const familyRoutes = require('./routes/family');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodsRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/admin', adminRoutes);

// 全局错误中间件
app.use((err, req, res, _next) => {
  console.error('服务器错误:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    data: null,
    message: err.message || '服务器内部错误',
  });
});

app.listen(PORT, () => {
  console.log(`🍽️  「今天吃什么」后端服务已启动: http://localhost:${PORT}`);
});
