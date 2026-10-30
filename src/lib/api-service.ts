const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/external-api';

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

  static async fetchWithRetry(path: string, options: RequestInit, retries = 2): Promise<Response> {
    let lastError: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${API_BASE}${path}`, options);
        // If 502 Bad Gateway or 504 Gateway Timeout from proxy/reverse-proxy, retry after a short pause
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
    throw lastError || new Error('Network request failed');
  }

  static async get(path: string) {
    const res = await this.fetchWithRetry(path, { headers: this.headers });
    if (!res.ok) {
      try {
        const json = await res.json();
        return json;
      } catch (e) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
    }
    return res.json();
  }

  static async post(path: string, body: any) {
    const res = await this.fetchWithRetry(path, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      try {
        const json = await res.json();
        return json;
      } catch (e) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
    }
    return res.json();
  }

  static async put(path: string, body: any) {
    const res = await this.fetchWithRetry(path, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      try {
        const json = await res.json();
        return json;
      } catch (e) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
    }
    return res.json();
  }

  static async delete(path: string, body?: any) {
    const res = await this.fetchWithRetry(path, {
      method: 'DELETE',
      headers: this.headers,
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!res.ok) {
      try {
        const json = await res.json();
        return json;
      } catch (e) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
    }
    return res.json();
  }
}
