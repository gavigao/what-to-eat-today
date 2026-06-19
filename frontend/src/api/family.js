import api from './index';

export const createFamily = (name) => api.post('/family/create', { name });
export const joinFamily = (pairingCode) => api.post('/family/join', { pairingCode });
export const getMyFamily = () => api.get('/family/mine');
export const leaveFamily = (familyId) => api.post(`/family/${familyId}/leave`);
export const getFamilyMemberMeals = (userId, date) =>
  api.get(`/family/members/${userId}/meals`, { params: { date } });
