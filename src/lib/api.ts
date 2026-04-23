const API_BASE = '/api';

export const api = {
  get: async (endpoint: string, token?: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error || `API request failed: ${res.status}`;
      if (res.status === 403 || res.status === 401) {
        window.dispatchEvent(new CustomEvent('api-auth-error', { detail: { message: errorMsg } }));
      }
      throw new Error(errorMsg);
    }
    return res.json();
  },
  post: async (endpoint: string, body: any, token?: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error || `API request failed: ${res.status}`;
      if (res.status === 403 || res.status === 401) {
        window.dispatchEvent(new CustomEvent('api-auth-error', { detail: { message: errorMsg } }));
      }
      throw new Error(errorMsg);
    }
    return res.json();
  }
};
