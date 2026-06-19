import api from './index';

export const loginApi = (username, password) =>
  api.post('/auth/login', { username, password });

export const registerApi = (username, password, email, inviteCode) =>
  api.post('/auth/register', { username, password, email, inviteCode });

export const refreshApi = (refreshToken) =>
  api.post('/auth/refresh', { refreshToken });

export const logoutApi = (refreshToken) =>
  api.post('/auth/logout', { refreshToken });
