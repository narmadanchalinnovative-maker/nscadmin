const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://201.18.192.154:3001/api';

export class ApiService {
  static get token() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  }

  static get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
    };
  }

  static async get(path: string) {
    const res = await fetch(`${API_BASE}${path}`, { headers: this.headers });
    if (!res.ok) {
      try {
        return await res.json();
      } catch (e) {
        throw new Error(`API Error: ${res.statusText}`);
      }
    }
    return res.json();
  }

  static async post(path: string, body: any) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      try {
        return await res.json();
      } catch (e) {
        throw new Error(`API Error: ${res.statusText}`);
      }
    }
    return res.json();
  }

  static async put(path: string, body: any) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      try {
        return await res.json();
      } catch (e) {
        throw new Error(`API Error: ${res.statusText}`);
      }
    }
    return res.json();
  }

  static async delete(path: string, body?: any) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: this.headers,
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!res.ok) {
      try {
        return await res.json();
      } catch (e) {
        throw new Error(`API Error: ${res.statusText}`);
      }
    }
    return res.json();
  }
}
