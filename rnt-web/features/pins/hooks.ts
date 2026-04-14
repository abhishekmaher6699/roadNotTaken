import { useEffect, useState } from "react";
import { getPinsApi, createPinApi, deletePinApi, updatePinApi } from "./api";
import { CreatePinInput, Pin, UpdatePinInput } from "./types";

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

  const editPin = async (id: string, data: UpdatePinInput) => {
    const updatedPin = await updatePinApi(id, data);
    setPins((prev) =>
      prev.map((pin) => (pin.id === id ? { ...pin, ...updatedPin } : pin))
    );
    return updatedPin;
  };

  return { pins, addPin, editPin, removePin };
}
