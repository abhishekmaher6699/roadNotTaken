import { useEffect, useState } from "react";
import { getPinsApi, createPinApi } from "./api";

export function usePins() {
  const [pins, setPins] = useState<any[]>([]);

  useEffect(() => {
    getPinsApi()
      .then((data) => {
        console.log("API response:", data); // 🔍 debug

        // Ensure it's always an array
        if (Array.isArray(data)) {
          setPins(data);
        } else {
          setPins(data.data || []);
        }
      })
      .catch(() => setPins([]));
  }, []);

  const addPin = async (data: any) => {
    const newPin = await createPinApi(data);
    setPins((prev) => [...prev, newPin]);
  };

  return { pins, addPin };
}