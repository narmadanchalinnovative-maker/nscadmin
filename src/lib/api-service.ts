function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return '/external-api';
  }
  // Server-side base URL resolution
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/external-api`;
  }
  return 'http://201.18.192.154:3001/api';
}

export class ApiService {
  static get token() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token') || localStorage.getItem('adminToken') || null;
  }

  static get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
    };
  }

  static async fetchWithRetry(path: string, options: RequestInit, retries = 2): Promise<Response> {
    const base = getApiBase();
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        // If 502 Bad Gateway or 503/504 from proxy, retry after a short pause
        if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < retries) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        return res;
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
      }
    }
    throw lastError || new Error(`Network request to ${url} failed`);
  }

  static async get(path: string): Promise<any> {
    try {
      const res = await this.fetchWithRetry(path, { headers: this.headers });
      try {
        const json = await res.json();
        return json;
      } catch (e) {
        return { success: res.ok, status: res.status, data: [] };
      }
    } catch (err: any) {
      console.error(`ApiService.get error on ${path}:`, err);
      return { success: false, error: err.message, data: [] };
    }
  }

  static async post(path: string, body: any): Promise<any> {
    try {
      const res = await this.fetchWithRetry(path, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      try {
        const json = await res.json();
        return json;
      } catch (e) {
        return { success: res.ok, status: res.status };
      }
    } catch (err: any) {
      console.error(`ApiService.post error on ${path}:`, err);
      return { success: false, error: err.message };
    }
  }

  static async put(path: string, body: any): Promise<any> {
    try {
      const res = await this.fetchWithRetry(path, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      try {
        const json = await res.json();
        return json;
      } catch (e) {
        return { success: res.ok, status: res.status };
      }
    } catch (err: any) {
      console.error(`ApiService.put error on ${path}:`, err);
      return { success: false, error: err.message };
    }
  }

  static async delete(path: string, body?: any): Promise<any> {
    try {
      const res = await this.fetchWithRetry(path, {
        method: 'DELETE',
        headers: this.headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      try {
        const json = await res.json();
        return json;
      } catch (e) {
        return { success: res.ok, status: res.status };
      }
    } catch (err: any) {
      console.error(`ApiService.delete error on ${path}:`, err);
      return { success: false, error: err.message };
    }
  }
}
