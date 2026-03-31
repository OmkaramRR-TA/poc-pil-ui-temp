export {
  default as httpClient,
  get,
  post,
  put,
  patch,
  del,
} from "./httpClient";
export type { ApiResponse, PaginatedResponse, ApiError, Fleet } from "./types";
export { getFleets } from "./fleetApi";
