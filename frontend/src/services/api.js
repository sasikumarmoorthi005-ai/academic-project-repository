import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pv_token');
  if (token) {
    config.headers = config.headers || {};
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export function errMsg(err) {
  const data = err.response?.data;
  const isLoginRequest = err.config?.url?.includes('/auth/login');
  if (err.response?.status === 401) {
    if (isLoginRequest) return 'Incorrect email or password. Check your details and try again.';
    if (typeof data === 'string' && data.trim()) return data;
    return data?.message || data?.detail || 'The server rejected your sign-in token. Your changes were not saved.';
  }
  return data?.message || data?.detail || data?.error || err.message || 'Something went wrong';
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

export async function downloadFile(file) {
  const res = await api.get(`/files/${file.id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default api;
