type CloudinaryVariant =
  | "thumbnail"
  | "card"
  | "card-contain"
  | "card-natural"
  | "hero"
  | "hero-contain"
  | "hero-natural"
  | "gallery-preview"
  | "avatar";

const VARIANT_TRANSFORMS: Record<CloudinaryVariant, string> = {
  thumbnail: "f_auto,q_auto,c_fill,w_240,h_240",
  card: "f_auto,q_auto,c_fill,w_720,h_480",
  "card-contain": "f_auto,q_auto,c_fit,w_720,h_480",
  "card-natural": "f_auto,q_auto,w_720",
  hero: "f_auto,q_auto,c_fill,w_1400,h_900",
  "hero-contain": "f_auto,q_auto,c_fit,w_1400,h_900",
  "hero-natural": "f_auto,q_auto,w_1400",
  "gallery-preview": "f_auto,q_auto,c_fill,w_480,h_480",
  avatar: "f_auto,q_auto,c_fill,w_160,h_160",
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
