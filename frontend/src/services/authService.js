// 19.03 - Funciones de autenticacion: login y getMe

import api from './api';

const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    return data; // { token, user }
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data; // objeto usuario
  },
};

export default authService;
