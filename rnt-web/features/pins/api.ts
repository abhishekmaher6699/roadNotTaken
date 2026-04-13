import { apiClient } from "@/lib/api-client";

export function getPinsApi() {
  return apiClient("/pins");
}

export function createPinApi(data: any) {
  return apiClient("/pins", {
    method: "POST",
    body: JSON.stringify(data),
  });
}