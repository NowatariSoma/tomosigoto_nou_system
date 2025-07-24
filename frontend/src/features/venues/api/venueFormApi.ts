import { VenueFormData, VenueImage } from '../types/venueForm';

// APIのベースURL（環境変数から取得、デフォルトは開発用）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// APIエラークラス
export class VenueApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'VenueApiError';
  }
}

// レスポンス型定義
interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

interface VenueResponse {
  id: number;
  basicInfo: {
    name: string;
    description: string;
    address: string;
    capacity: number;
    hourlyRate: number;
    contactPhone: string;
    contactEmail: string;
    accessInfo: string;
    notes: string;
  };
  equipment: any[];
  availability: {
    recurringSlots: any[];
    specialSlots: any[];
  };
  images: VenueImage[];
  createdAt: string;
  updatedAt: string;
}

// HTTPヘルパー関数
const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new VenueApiError(
        errorData.message || `HTTP Error: ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof VenueApiError) {
      throw error;
    }
    
    throw new VenueApiError(
      error instanceof Error ? error.message : '不明なエラーが発生しました'
    );
  }
};

// 会場データを取得
export const fetchVenue = async (venueId: number): Promise<VenueFormData> => {
  const response: ApiResponse<VenueResponse> = await fetchWithErrorHandling(
    `${API_BASE_URL}/venues/${venueId}`
  );

  // レスポンスデータを VenueFormData 形式に変換
  return {
    basicInfo: response.data.basicInfo,
    equipment: response.data.equipment,
    availability: response.data.availability,
    images: response.data.images
  };
};

// 新規会場を作成
export const createVenue = async (formData: VenueFormData): Promise<number> => {
  const response: ApiResponse<{ venueId: number }> = await fetchWithErrorHandling(
    `${API_BASE_URL}/venues`,
    {
      method: 'POST',
      body: JSON.stringify(formData),
    }
  );

  return response.data.venueId;
};

// 会場情報を更新
export const updateVenue = async (venueId: number, formData: VenueFormData): Promise<void> => {
  await fetchWithErrorHandling(
    `${API_BASE_URL}/venues/${venueId}`,
    {
      method: 'PUT',
      body: JSON.stringify(formData),
    }
  );
};

// 会場を削除
export const deleteVenue = async (venueId: number): Promise<void> => {
  await fetchWithErrorHandling(
    `${API_BASE_URL}/venues/${venueId}`,
    {
      method: 'DELETE',
    }
  );
};

// 画像をアップロード
export const uploadVenueImage = async (file: File): Promise<VenueImage> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${API_BASE_URL}/venues/images/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new VenueApiError(
        errorData.message || `HTTP Error: ${response.status}`,
        response.status,
        errorData
      );
    }

    const result: ApiResponse<VenueImage> = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof VenueApiError) {
      throw error;
    }
    
    throw new VenueApiError(
      error instanceof Error ? error.message : '画像のアップロードに失敗しました'
    );
  }
};

// 画像を削除
export const deleteVenueImage = async (imageId: string): Promise<void> => {
  await fetchWithErrorHandling(
    `${API_BASE_URL}/venues/images/${imageId}`,
    {
      method: 'DELETE',
    }
  );
};

// 設備タイプ一覧を取得
export const fetchEquipmentTypes = async () => {
  const response: ApiResponse<any[]> = await fetchWithErrorHandling(
    `${API_BASE_URL}/venues/equipment-types`
  );

  return response.data;
};

// 利用可能時間の検証
export const validateAvailability = async (
  availability: VenueFormData['availability']
): Promise<{ isValid: boolean; conflicts?: any[] }> => {
  const response: ApiResponse<{ isValid: boolean; conflicts?: any[] }> = 
    await fetchWithErrorHandling(
      `${API_BASE_URL}/venues/availability/validate`,
      {
        method: 'POST',
        body: JSON.stringify({ availability }),
      }
    );

  return response.data;
};

// 会場の利用可能性をチェック
export const checkVenueAvailability = async (
  venueId: number,
  startDateTime: Date,
  endDateTime: Date
): Promise<{ isAvailable: boolean; conflicts?: any[] }> => {
  const response: ApiResponse<{ isAvailable: boolean; conflicts?: any[] }> = 
    await fetchWithErrorHandling(
      `${API_BASE_URL}/venues/${venueId}/availability/check?` + 
      new URLSearchParams({
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
      }).toString()
    );

  return response.data;
};

// 会場一覧を取得（検索・フィルタリング用）
export const searchVenues = async (params: {
  query?: string;
  capacity?: number;
  equipment?: string[];
  availableFrom?: Date;
  availableTo?: Date;
  page?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  
  if (params.query) searchParams.append('query', params.query);
  if (params.capacity) searchParams.append('capacity', params.capacity.toString());
  if (params.equipment?.length) {
    params.equipment.forEach(eq => searchParams.append('equipment', eq));
  }
  if (params.availableFrom) {
    searchParams.append('availableFrom', params.availableFrom.toISOString());
  }
  if (params.availableTo) {
    searchParams.append('availableTo', params.availableTo.toISOString());
  }
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const response: ApiResponse<{
    venues: any[];
    total: number;
    page: number;
    totalPages: number;
  }> = await fetchWithErrorHandling(
    `${API_BASE_URL}/venues/search?${searchParams.toString()}`
  );

  return response.data;
};

// 会場の複製
export const duplicateVenue = async (venueId: number): Promise<number> => {
  const response: ApiResponse<{ venueId: number }> = await fetchWithErrorHandling(
    `${API_BASE_URL}/venues/${venueId}/duplicate`,
    {
      method: 'POST',
    }
  );

  return response.data.venueId;
};

// 一括操作用API
export const bulkUpdateVenues = async (
  venueIds: number[],
  updates: Partial<VenueFormData>
): Promise<void> => {
  await fetchWithErrorHandling(
    `${API_BASE_URL}/venues/bulk-update`,
    {
      method: 'PUT',
      body: JSON.stringify({
        venueIds,
        updates,
      }),
    }
  );
};

export const bulkDeleteVenues = async (venueIds: number[]): Promise<void> => {
  await fetchWithErrorHandling(
    `${API_BASE_URL}/venues/bulk-delete`,
    {
      method: 'DELETE',
      body: JSON.stringify({ venueIds }),
    }
  );
};