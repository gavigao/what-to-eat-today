import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器：自动附带 access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 自动刷新相关状态
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// 响应拦截器
api.interceptors.response.use(
  (res) => res.data, // 统一提取 data
  async (err) => {
    const originalRequest = err.config;

    // 401 自动刷新 token
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 已有刷新进行中，排队等待
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(new Error('请重新登录'));
      }

      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(new Error('登录已过期，请重新登录'));
      } finally {
        isRefreshing = false;
      }
    }

    // 普通错误
    const message = err.response?.data?.message || '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

// ===== 食物库 =====
export const searchFoods = (q) => api.get('/foods/search', { params: { q } });
export const getCategories = () => api.get('/foods/categories');
export const createFood = (data) => api.post('/foods', data);
export const deleteCustomFood = (id) => api.delete(`/foods/${id}`);

// ===== 饮食记录 =====
export const getMeals = (date) => api.get('/meals', { params: { date } });
export const addMeal = (data) => api.post('/meals', data);
export const deleteMeal = (id) => api.delete(`/meals/${id}`);
export const getSummary = (date) => api.get('/meals/summary', { params: { date } });
export const getTrend = (days = 7) => api.get('/meals/trend', { params: { days } });
export const getMonthly = (year, month) => api.get('/meals/monthly', { params: { year, month } });
export const getMealDetails = (date) => api.get('/meals/details', { params: { date } });

// ===== AI =====
export const analyzeDiet = (date) => api.post('/ai/analyze', { date });
export const getAnalysis = (date) => api.get('/ai/analysis', { params: { date } });
export const estimateFood = (foodName) => api.post('/ai/estimate-food', { foodName });
export const recommendFood = (date, mealType) => api.post('/ai/recommend', { date, meal_type: mealType });

// ===== 个人画像 =====
export const getProfile = () => api.get('/profile');
export const updateProfile = (data) => api.put('/profile', data);
export const getWeightLog = (days = 30) => api.get('/profile/weight-log', { params: { days } });

export default api;
