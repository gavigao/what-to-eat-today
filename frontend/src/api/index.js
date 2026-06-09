import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 响应拦截器：统一提取 data
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
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
