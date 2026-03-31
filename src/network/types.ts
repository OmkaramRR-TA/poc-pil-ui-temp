export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Fleet {
  vesselId: string;
  latitude: number;
  longitude: number;
  direction: number;
  status: string;
}

export interface ApiError {
  message: string;
  code?: string | number;
  status?: number;
}
