const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Debug: print the resolved API base URL at module load so we can verify the value
// (This will be visible in the browser console when the app loads in dev).
try {
  // eslint-disable-next-line no-console
  console.log('[debug] API_BASE_URL =', API_BASE_URL);
} catch (e) {
  // ignore in environments without console
}

export interface Profile {
  id: string;
  name: string;
  bio: string;
  profile_pic: string;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  price: number;
  downloads: number;
  category: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Transaction {
  id: string;
  buyer_id: string;
  creator_id: string;
  image_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  stripe_payment_id: string | null;
  created_at: string;
}

export interface DownloadToken {
  id: string;
  transaction_id: string;
  buyer_id: string;
  image_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] Making request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log(`[API] Response status:`, response.status);

      if (!response.ok) {
        let errorData;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText };
            }
          }
        } catch (e) {
          errorData = { error: 'Unknown error' };
        }

        const error = new Error(errorData?.message || errorData?.error || `HTTP error ${response.status}`);
        (error as any).status = response.status;
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }

      // For successful responses, try to parse JSON
      try {
        const data = await response.json();
        console.log(`[API] Success response:`, data);
        return data;
      } catch (e) {
        // If response is empty or not JSON
        if (response.status === 204) {
          return null as T;
        }
        throw new Error('Invalid JSON response');
      }
    } catch (error) {
      console.error(`[API] Request failed:`, error);
      throw error;
    }
  }

  // Profiles
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

  // Images
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

  async uploadImages(imageFile: File, thumbnailFile: File): Promise<{ image_url: string; thumbnail_url: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('thumbnail', thumbnailFile);

    const url = `${API_BASE_URL}/upload`;
    console.log('[Upload] Starting upload to:', url);
    console.log('[Upload] Files:', { image: imageFile, thumbnail: thumbnailFile });

    // Set longer timeout for upload
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);
      console.log('[Upload] Response status:', response.status);

      // Always try to read the response body
      let responseBody;
      try {
        responseBody = await response.json();
        console.log('[Upload] Response body:', responseBody);
      } catch (error) {
        console.error('[Upload] Failed to parse response as JSON:', error);
        throw new Error(`Upload failed: Server returned status ${response.status} with invalid JSON`);
      }

      // Check for error responses
      if (!response.ok || responseBody.error) {
        const errorMessage = responseBody.error || responseBody.details || `Upload failed: ${response.status} ${response.statusText}`;
        console.error('[Upload] Error response:', errorMessage);
        throw new Error(errorMessage);
      }

      // Validate response has required fields
      if (!responseBody.image_url || !responseBody.thumbnail_url) {
        console.error('[Upload] Invalid success response:', responseBody);
        throw new Error('Upload failed: Server response missing required URLs');
      }

      console.log('[Upload] Success response:', responseBody);
      return {
        image_url: responseBody.image_url,
        thumbnail_url: responseBody.thumbnail_url
      };
    } catch (error) {
      console.error('[Upload] Request failed:', error);
      throw error;
    }
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

  // Transactions
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

  // Download Tokens
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

export const api = new ApiClient();
