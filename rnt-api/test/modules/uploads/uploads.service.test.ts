import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCloudinaryUploadSignature } from '../../../src/modules/uploads/uploads.service';

describe('uploads.service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('throws when cloudinary env vars are missing', () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    expect(() => getCloudinaryUploadSignature()).toThrow(
      'Cloudinary env vars are missing'
    );
  });

  it('uses the default upload folder when none is configured', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    delete process.env.CLOUDINARY_UPLOAD_FOLDER;

    const result = getCloudinaryUploadSignature();
    const expectedTimestamp = 1_700_000_000;
    const expectedSignature = crypto
      .createHash('sha1')
      .update(`folder=road-not-taken/pins&timestamp=${expectedTimestamp}secret`)
      .digest('hex');

    expect(result).toEqual({
      timestamp: expectedTimestamp,
      folder: 'road-not-taken/pins',
      signature: expectedSignature,
      cloudName: 'cloud',
      apiKey: 'key',
    });
  });

  it('uses a custom upload folder when configured', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    process.env.CLOUDINARY_UPLOAD_FOLDER = 'custom-folder';

    const result = getCloudinaryUploadSignature();

    expect(result.folder).toBe('custom-folder');
  });
});
