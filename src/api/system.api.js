import { apiRequest } from "./client";

export function getAppConfig() {
  return apiRequest("/config");
}
