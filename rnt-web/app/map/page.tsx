"use client";

import { usePins } from "@/features/pins/hooks";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/components/map/mapView"), {
  ssr: false, // 
});



export default function MapPage() {
  const { pins, addPin } = usePins();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="h-screen">
      <MapView
        pins={pins}
        onAddPin={(latlng) =>
          addPin({
            title: "New Pin",
            latitude: latlng.lat,
            longitude: latlng.lng,
          })
        }
      />
    </div>
  );
}