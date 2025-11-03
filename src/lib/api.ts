// Default to the local dev backend started from `database/server.mjs`.
// The server exposes Netlify function routes under `/.netlify/functions/server`.
// If you deploy, set VITE_API_BASE_URL in your environment (Netlify/Vercel) to
// the production API host or a relative path like `/.netlify/functions/server`.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001/.netlify/functions/server';

// Types used by the app
export type Profile = {
  id: string;
  name: string;
  bio?: string;
  profile_pic?: string;
  wallet_balance?: number;
  created_at?: string;
  updated_at?: string;
};

export type Image = {
  id: string;
  url?: string;
  image_url?: string;
  thumbnail_url: string;
  title: string;
  description: string;
  price: number;
  created_at?: string;
  updated_at?: string;
  owner_id?: string;
  creator_id?: string;
  downloads?: number;
  category?: string;
};

export type Transaction = {
  id: string;
  buyer_id: string;
  seller_id?: string;
  creator_id?: string;
  image_id: string;
  amount: number;
  status?: 'pending' | 'completed' | 'failed';
  stripe_payment_id?: string | null;
  created_at?: string;
};

export type DownloadToken = {
  id: string;
  image_id: string;
  buyer_id: string;
  token: string;
  used?: boolean;
  created_at?: string;
};

type UploadResponse = { image_url: string; thumbnail_url: string };

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
};

export class Api {
  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      credentials: options.credentials || 'include',
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // ignore parse errors
      }
      throw new Error(errorMessage);
    }

    // Parse response defensively
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    if (!text) return null as unknown as T;
    if (contentType.includes('application/json')) return JSON.parse(text) as T;
    return text as unknown as T;
  }

  // Upload images (multipart)
  async uploadImages(imageFile: File, thumbnailFile?: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

    const url = `${API_BASE_URL}/upload`;
    const response = await fetch(url, { method: 'POST', body: formData, credentials: 'include' });
    if (!response.ok) {
      let msg = 'Failed to upload images';
      try { const d = await response.json(); msg = d.message || msg; } catch {};
      throw new Error(msg);
    }
    return response.json();
  }

  // Direct download helper for free images
  async downloadImage(imageId: string): Promise<void> {
    const image = await this.getImage(imageId);
    if (!image || !(image.image_url || image.url)) throw new Error('Image not found or invalid');
    const href = image.image_url || image.url!;
    const link = document.createElement('a');
    link.href = href;
    link.download = image.title || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Profile methods
  async getProfiles(): Promise<Profile[]> { return this.request('/profiles'); }
  async getProfile(id: string): Promise<Profile> { return this.request(`/profiles/${id}`); }
  async createProfile(profile: Partial<Profile>): Promise<Profile> {
    return this.request('/profiles', { method: 'POST', body: JSON.stringify(profile) });
  }
  async updateProfile(id: string, profile: Partial<Profile>): Promise<Profile> {
    return this.request(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(profile) });
  }

  // Image methods
  async getImages(page?: number, limit?: number): Promise<{ images: Image[]; pagination: { page: number; pages: number; total: number } }> {
    const queryParams = new URLSearchParams();
    if (page !== undefined) queryParams.append('page', String(page));
    if (limit !== undefined) queryParams.append('limit', String(limit));
    return this.request(`/images?${queryParams.toString()}`);
  }
  async getImage(id: string): Promise<Image> { return this.request(`/images/${id}`); }
  async getImagesByCreator(creatorId: string): Promise<Image[]> { return this.request(`/images/creator/${creatorId}`); }
  async createImage(image: Partial<Image>): Promise<Image> { return this.request('/images', { method: 'POST', body: JSON.stringify(image) }); }
  async updateImage(id: string, image: Partial<Image>): Promise<Image> { return this.request(`/images/${id}`, { method: 'PUT', body: JSON.stringify(image) }); }
  async deleteImage(id: string): Promise<{ message: string }> { return this.request(`/images/${id}`, { method: 'DELETE' }); }

  // Transactions (kept for compatibility)
  async getTransactions(): Promise<Transaction[]> { return this.request('/transactions'); }
  async getTransactionsByBuyer(buyerId: string): Promise<Transaction[]> { return this.request(`/transactions/buyer/${buyerId}`); }
  async getTransactionsByCreator(creatorId: string): Promise<Transaction[]> { return this.request(`/transactions/creator/${creatorId}`); }
  async createTransaction(transaction: Omit<Transaction, 'created_at'>): Promise<Transaction> { return this.request('/transactions', { method: 'POST', body: JSON.stringify(transaction) }); }

  // Download tokens
  async getDownloadTokensByBuyer(buyerId: string): Promise<DownloadToken[]> { return this.request(`/download-tokens/buyer/${buyerId}`); }
  async validateDownloadToken(token: string): Promise<{ valid: boolean; image_id: string }> { return this.request(`/download-tokens/validate/${token}`); }
  async createDownloadToken(token: Omit<DownloadToken, 'created_at'>): Promise<DownloadToken> { return this.request('/download-tokens', { method: 'POST', body: JSON.stringify(token) }); }
  async markTokenAsUsed(token: string): Promise<DownloadToken> { return this.request(`/download-tokens/use/${token}`, { method: 'PUT' }); }
}

// singleton instance used across the app
export const api = new Api();

// default export kept for convenience in some files
export default api;