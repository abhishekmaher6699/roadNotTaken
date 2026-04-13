import { redirect } from "next/navigation";
import { MapPageClient } from "./map-page-client";
import { getServerAuthUser } from "@/lib/server-auth";

export default async function MapPage() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  return <MapPageClient />;
}
