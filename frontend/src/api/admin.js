import api from './index';

export const listUsers = (page = 1, limit = 20) =>
  api.get('/admin/users', { params: { page, limit } });

export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

export const generateInviteCodes = (count = 1, maxUses = 1) =>
  api.post('/admin/invite-codes', { count, maxUses });

export const listInviteCodes = () => api.get('/admin/invite-codes');

export const deactivateInviteCode = (id) =>
  api.post(`/admin/invite-codes/${id}/deactivate`);
