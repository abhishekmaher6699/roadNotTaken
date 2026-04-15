import { describe, expect, it } from "vitest";
import { getOptimizedCloudinaryUrl } from "../../lib/cloudinary";

describe("cloudinary helpers", () => {
  it("returns undefined for empty urls", () => {
    expect(getOptimizedCloudinaryUrl(undefined, "hero")).toBeUndefined();
    expect(getOptimizedCloudinaryUrl(null, "hero")).toBeUndefined();
  });

  it("returns non-cloudinary urls unchanged", () => {
    expect(
      getOptimizedCloudinaryUrl("https://example.com/image.jpg", "hero")
    ).toBe("https://example.com/image.jpg");
  });

  it("injects the correct transformation for cloudinary urls", () => {
    expect(
      getOptimizedCloudinaryUrl(
        "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
        "hero"
      )
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,w_1400,h_900/v1/sample.jpg"
    );
  });
});
