"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { usePins } from "@/features/pins/hooks";
import { useAuth } from "@/features/auth/hooks";

const MapView = dynamic(() => import("@/components/map/mapView"), {
  ssr: false,
});

export function MapPageClient() {
  const { pins, addPin } = usePins();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="relative h-screen">
      <div className="absolute right-4 top-4 z-[1000]">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-md ring-1 ring-black/10 transition hover:bg-neutral-50"
        >
          Logout
        </button>
      </div>

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
