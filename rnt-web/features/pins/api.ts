import { apiClient } from "@/lib/api-client";
import { CreatePinInput, Pin } from "./types";

export function getPinsApi() {
  return apiClient("/pins") as Promise<Pin[]>;
}

export function createPinApi(data: CreatePinInput) {
  return apiClient("/pins", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Pin>;
}
