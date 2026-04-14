ALTER TABLE pins
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE pins
SET
  thumbnail_url = COALESCE(thumbnail_url, image_url),
  image_urls = CASE
    WHEN array_length(image_urls, 1) IS NULL AND image_url IS NOT NULL
      THEN ARRAY[image_url]
    ELSE image_urls
  END;
