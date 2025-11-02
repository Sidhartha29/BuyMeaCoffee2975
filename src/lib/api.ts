const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

try {
  console.log('[debug] API_BASE_URL =', API_BASE_URL);
} catch (e) {
  // ignore in environments without console
}

// Type definitions
export type Profile = {
  id: string;
  name: string;
  bio: string;
  profile_pic: string;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
};

export type Image = {
  id: string;
  url?: string;
  // Cloudinary / server may return `image_url` as the full-size image url
  image_url?: string;
  thumbnail_url: string;
  title: string;
  description: string;
  price: number;
  created_at: string;
  updated_at: string;
  owner_id?: string;
  // Backwards-compatible creator field used across the app
  creator_id?: string;
  // Additional fields used by UI
  downloads?: number;
  category?: string;
};

export type Transaction = {
  id: string;
  buyer_id: string;
  // Historically named seller; modern code expects creator_id
  seller_id?: string;
  creator_id?: string;
  image_id: string;
  amount: number;
  status?: 'pending' | 'completed' | 'failed';
  stripe_payment_id?: string | null;
  created_at: string;
};

export type DownloadToken = {
  id: string;
  image_id: string;
  buyer_id: string;
  token: string;
  used: boolean;
  created_at: string;
};

type UploadResponse = {
  image_url: string;
  thumbnail_url: string;
};

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
        console.error('[API] Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    try {
      return await response.json();
    } catch (e) {
      console.error('[API] Failed to parse success response:', e);
      throw new Error('Server returned invalid JSON response');
    }
  }

  async uploadImages(imageFile: File, thumbnailFile: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('thumbnail', thumbnailFile);

    const url = `${API_BASE_URL}/upload`;
    console.log('[Upload] Starting upload to:', url);
    console.log('[Upload] Files:', { image: imageFile, thumbnail: thumbnailFile });

    const uploadWithRetry = async (retryCount = 0): Promise<Response> => {
      try {
        return await fetch(url, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      } catch (error) {
        if (retryCount < 3) {
          console.log(`[Upload] Retry attempt ${retryCount + 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return uploadWithRetry(retryCount + 1);
        }
        throw error;
      }
    };

    try {
      const response = await uploadWithRetry();
      if (!response.ok) {
        let errorMessage = 'Failed to upload images';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('[Upload] Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      try {
        const data = await response.json();
        console.log('[Upload] Upload successful:', data);
        return data;
      } catch (e) {
        console.error('[Upload] Failed to parse success response:', e);
        throw new Error('Server returned invalid response');
      }
    } catch (error) {
      console.error('[Upload] Upload failed:', error);
      throw error;
    }
  }

  // Profile methods
  async getProfiles(): Promise<Profile[]> {
    return this.request('/profiles');
  }

  async getProfile(id: string): Promise<Profile> {
    return this.request(`/profiles/${id}`);
  }

  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    return this.request('/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async updateProfile(id: string, profile: Partial<Profile>): Promise<Profile> {
    return this.request(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  // Image methods
  async getImages(page?: number, limit?: number): Promise<{ images: Image[]; pagination: { page: number; pages: number; total: number } }> {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    const data = await this.request<{ images: Image[]; pagination: { page: number; pages: number; total: number } }>(`/images?${queryParams.toString()}`);
    return data;
  }

  async getImage(id: string): Promise<Image> {
    return this.request(`/images/${id}`);
  }

  async getImagesByCreator(creatorId: string): Promise<Image[]> {
    return this.request(`/images/creator/${creatorId}`);
  }

  async createImage(image: Omit<Image, 'created_at' | 'updated_at'>): Promise<Image> {
    return this.request('/images', {
      method: 'POST',
      body: JSON.stringify(image),
    });
  }

  async updateImage(id: string, image: Partial<Image>): Promise<Image> {
    return this.request(`/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify(image),
    });
  }

  async deleteImage(id: string): Promise<{ message: string }> {
    return this.request(`/images/${id}`, {
      method: 'DELETE',
    });
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return this.request('/transactions');
  }

  async getTransactionsByBuyer(buyerId: string): Promise<Transaction[]> {
    return this.request(`/transactions/buyer/${buyerId}`);
  }

  async getTransactionsByCreator(creatorId: string): Promise<Transaction[]> {
    return this.request(`/transactions/creator/${creatorId}`);
  }

  async createTransaction(transaction: Omit<Transaction, 'created_at'>): Promise<Transaction> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Download token methods
  async getDownloadTokensByBuyer(buyerId: string): Promise<DownloadToken[]> {
    return this.request(`/download-tokens/buyer/${buyerId}`);
  }

  async validateDownloadToken(token: string): Promise<{ valid: boolean; image_id: string }> {
    return this.request(`/download-tokens/validate/${token}`);
  }

  async createDownloadToken(token: Omit<DownloadToken, 'created_at'>): Promise<DownloadToken> {
    return this.request('/download-tokens', {
      method: 'POST',
      body: JSON.stringify(token),
    });
  }

  async markTokenAsUsed(token: string): Promise<DownloadToken> {
    return this.request(`/download-tokens/use/${token}`, {
      method: 'PUT',
    });
  }
}

// Export a singleton instance
export const api = new Api();
export default api;