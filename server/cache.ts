interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { data, expiry });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const serverCache = new MemoryCache();
