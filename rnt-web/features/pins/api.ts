import { apiClient } from "@/lib/api-client";
import { CreatePinInput, Pin, UpdatePinInput } from "./types";

export function getPinsApi() {
  return apiClient("/pins") as Promise<Pin[]>;
}

export function createPinApi(data: CreatePinInput) {
  return apiClient("/pins", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Pin>;
}

export function deletePinApi(id: string) {
  return apiClient(`/pins/${id}`, {
    method: "DELETE",
  }) as Promise<{ id: string }>;
}

export function updatePinApi(id: string, data: UpdatePinInput) {
  return apiClient(`/pins/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }) as Promise<Pin>;
}
