interface AsyncCacheEntry<T> {
  expiresAt: number;
  value?: T;
  request?: Promise<T>;
}

export function createAsyncCache<T>(ttlMs: number) {
  const entries = new Map<string, AsyncCacheEntry<T>>();

  return {
    get(key: string, loader: () => Promise<T>) {
      const cached = entries.get(key);
      const now = Date.now();

      if (cached?.value !== undefined && cached.expiresAt > now) {
        return Promise.resolve(cached.value);
      }

      if (cached?.request) {
        return cached.request;
      }

      const request = loader()
        .then((value) => {
          entries.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
          });
          return value;
        })
        .catch((error) => {
          entries.delete(key);
          throw error;
        });

      entries.set(key, {
        request,
        expiresAt: now + ttlMs,
      });

      return request;
    },

    set(key: string, value: T) {
      entries.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    },

    delete(key: string) {
      entries.delete(key);
    },

    deleteByPrefix(prefix: string) {
      for (const key of entries.keys()) {
        if (key.startsWith(prefix)) {
          entries.delete(key);
        }
      }
    },

    clear() {
      entries.clear();
    },
  };
}
