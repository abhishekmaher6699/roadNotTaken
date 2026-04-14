import { useEffect, useState } from "react";
import { getPinsApi, createPinApi } from "./api";
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
  };

  return { pins, addPin };
}
