import { get } from "./httpClient";
import type { Fleet } from "./types";

export const getFleets = (): Promise<Fleet[]> => get<Fleet[]>("/fleet");
