type CloudinaryVariant = "thumbnail" | "card" | "hero" | "gallery-preview";

const VARIANT_TRANSFORMS: Record<CloudinaryVariant, string> = {
  thumbnail: "f_auto,q_auto,c_fill,w_240,h_240",
  card: "f_auto,q_auto,c_fill,w_720,h_480",
  hero: "f_auto,q_auto,c_fill,w_1400,h_900",
  "gallery-preview": "f_auto,q_auto,c_fill,w_480,h_480",
};

export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  variant: CloudinaryVariant
) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url ?? undefined;
  }

  const transform = VARIANT_TRANSFORMS[variant];
  return url.replace("/upload/", `/upload/${transform}/`);
}
