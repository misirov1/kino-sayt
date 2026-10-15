const RAW_API_BASE = import.meta.env.VITE_API_URL || '/api';
const API_BASE = RAW_API_BASE.endsWith('/') ? RAW_API_BASE.slice(0, -1) : RAW_API_BASE;

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('kinoverse_token');
  const adminPin = localStorage.getItem('kinoverse_admin_pin');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(adminPin ? { 'x-admin-pin': adminPin } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`API server javob bermadi (${res.status} HTML)`);
    }

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.error || data.message || `Xatolik: ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.warn(`API Fetch Error (${endpoint}):`, err.message);
    throw err;
  }
}
