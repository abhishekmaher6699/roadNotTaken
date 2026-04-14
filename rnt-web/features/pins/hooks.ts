import { useEffect, useState } from "react";
import { getPinsApi, createPinApi, deletePinApi } from "./api";
import { CreatePinInput, Pin } from "./types";

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    getPinsApi()
      .then((data) => {
        setPins(Array.isArray(data) ? data : []);
      })
      .catch(() => setPins([]));
  }, []);

  const addPin = async (data: CreatePinInput) => {
    const newPin = await createPinApi(data);
    setPins((prev) => [...prev, newPin]);
    return newPin;
  };

  const removePin = async (id: string) => {
    await deletePinApi(id);
    setPins((prev) => prev.filter((pin) => pin.id !== id));
  };

  return { pins, addPin, removePin };
}
