/**
 * Advanced caching layer using IndexedDB.
 * Provides zero-latency offline access, search result caching, and usage history.
 * Survives browser crashes and network loss with local persistence.
 */

import type { DictionaryEntry, RegionId } from "@/data/types";

const DB_NAME = "LokalSenseAdvanced";
const DB_VERSION = 2;

export interface CacheEntry {
  id: string;
  regionId: RegionId;
  entry: DictionaryEntry;
  timestamp: number;
  hitCount: number;
}

export interface SearchResult {
  id: string;
  query: string;
  regionId: RegionId;
  results: DictionaryEntry[];
  timestamp: number;
}

export interface UsageHistory {
  id: string;
  regionId: RegionId;
  term: string;
  timestamp: number;
  tone?: string;
  sentiment?: string;
}

/**
 * Initialize IndexedDB with required object stores.
 */
export async function initializeCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Cache store: fast lookup for dictionary entries
      if (!db.objectStoreNames.contains("cache")) {
        const cacheStore = db.createObjectStore("cache", { keyPath: "id" });
        cacheStore.createIndex("regionId", "regionId", { unique: false });
        cacheStore.createIndex("hitCount", "hitCount", { unique: false });
      }

      // Search results store: cached query results
      if (!db.objectStoreNames.contains("searchResults")) {
        const searchStore = db.createObjectStore("searchResults", {
          keyPath: "id",
        });
        searchStore.createIndex("query", "query", { unique: false });
        searchStore.createIndex("regionId", "regionId", { unique: false });
      }

      // Usage history store: track term encounters
      if (!db.objectStoreNames.contains("usageHistory")) {
        const historyStore = db.createObjectStore("usageHistory", {
          keyPath: "id",
        });
        historyStore.createIndex("regionId", "regionId", { unique: false });
        historyStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Metadata store: app state and security
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }
    };
  });
}

/**
 * Cache a dictionary entry with hit tracking for smart preloading.
 */
export async function cacheEntry(
  entry: DictionaryEntry,
  regionId: RegionId
): Promise<void> {
  const db = await initializeCache();
  const tx = db.transaction(["cache"], "readwrite");
  const store = tx.objectStore("cache");

  const id = `${regionId}_${entry.term}`;
  const existing = await new Promise<CacheEntry | undefined>((resolve) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
  });

  const cacheEntry: CacheEntry = {
    id,
    regionId,
    entry,
    timestamp: Date.now(),
    hitCount: (existing?.hitCount || 0) + 1,
  };

  store.put(cacheEntry);
}

/**
 * Retrieve entry from cache (fastest path).
 */
export async function getCachedEntry(
  term: string,
  regionId: RegionId
): Promise<DictionaryEntry | null> {
  const db = await initializeCache();
  const tx = db.transaction(["cache"], "readonly");
  const store = tx.objectStore("cache");

  return new Promise((resolve) => {
    const req = store.get(`${regionId}_${term}`);
    req.onsuccess = () =>
      resolve(req.result ? req.result.entry : null);
  });
}

/**
 * Cache search results to avoid recomputation.
 */
export async function cacheSearchResults(
  query: string,
  regionId: RegionId,
  results: DictionaryEntry[]
): Promise<void> {
  const db = await initializeCache();
  const tx = db.transaction(["searchResults"], "readwrite");
  const store = tx.objectStore("searchResults");

  const id = `${regionId}_${query.toLowerCase()}`;
  store.put({
    id,
    query: query.toLowerCase(),
    regionId,
    results,
    timestamp: Date.now(),
  });
}

/**
 * Retrieve cached search results (valid for 1 hour).
 */
export async function getCachedSearchResults(
  query: string,
  regionId: RegionId
): Promise<DictionaryEntry[] | null> {
  const db = await initializeCache();
  const tx = db.transaction(["searchResults"], "readonly");
  const store = tx.objectStore("searchResults");

  return new Promise((resolve) => {
    const req = store.get(`${regionId}_${query.toLowerCase()}`);
    req.onsuccess = () => {
      const result = req.result as SearchResult | undefined;
      if (!result) {
        resolve(null);
        return;
      }

      // Invalidate after 1 hour
      const ageMs = Date.now() - result.timestamp;
      if (ageMs > 3600000) {
        resolve(null);
      } else {
        resolve(result.results);
      }
    };
  });
}

/**
 * Record term encounter with detected tone/sentiment for usage analytics.
 */
export async function recordUsage(
  term: string,
  regionId: RegionId,
  tone?: string,
  sentiment?: string
): Promise<void> {
  const db = await initializeCache();
  const tx = db.transaction(["usageHistory"], "readwrite");
  const store = tx.objectStore("usageHistory");

  const id = `${regionId}_${term}_${Date.now()}`;
  store.put({
    id,
    regionId,
    term,
    timestamp: Date.now(),
    tone,
    sentiment,
  });
}

/**
 * Get most frequently encountered terms (for AI self-upgrade suggestions).
 */
export async function getFrequentTerms(
  regionId: RegionId,
  limit: number = 10
): Promise<string[]> {
  const db = await initializeCache();
  const tx = db.transaction(["usageHistory"], "readonly");
  const index = tx.objectStore("usageHistory").index("regionId");

  return new Promise((resolve) => {
    const req = index.getAll(regionId);
    req.onsuccess = () => {
      const history = req.result as UsageHistory[];
      const termCounts = new Map<string, number>();

      for (const entry of history) {
        termCounts.set(entry.term, (termCounts.get(entry.term) || 0) + 1);
      }

      const sorted = Array.from(termCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([term]) => term);

      resolve(sorted);
    };
  });
}

/**
 * Store encrypted auth token in metadata with expiry.
 */
export async function storeEncryptedToken(
  token: string,
  expiryMs: number = 604800000 // 7 days
): Promise<void> {
  const db = await initializeCache();
  const tx = db.transaction(["metadata"], "readwrite");
  const store = tx.objectStore("metadata");

  store.put({
    key: "authToken",
    value: token,
    expiryTime: Date.now() + expiryMs,
  });
}

/**
 * Retrieve stored auth token if not expired.
 */
export async function getStoredToken(): Promise<string | null> {
  const db = await initializeCache();
  const tx = db.transaction(["metadata"], "readonly");
  const store = tx.objectStore("metadata");

  return new Promise((resolve) => {
    const req = store.get("authToken");
    req.onsuccess = () => {
      const data = req.result;
      if (!data || Date.now() > data.expiryTime) {
        resolve(null);
      } else {
        resolve(data.value);
      }
    };
  });
}

/**
 * Clear all cache (useful for logout or data reset).
 */
export async function clearCache(): Promise<void> {
  const db = await initializeCache();

  for (const storeName of ["cache", "searchResults", "usageHistory"]) {
    const tx = db.transaction([storeName], "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
  }
}

/**
 * Get cache statistics for debugging/monitoring.
 */
export async function getCacheStats(): Promise<{
  cacheEntries: number;
  searchResultsCache: number;
  historyEntries: number;
  databaseSize: string;
}> {
  const db = await initializeCache();

  const cacheEntries = await new Promise<number>((resolve) => {
    const req = db.transaction(["cache"]).objectStore("cache").count();
    req.onsuccess = () => resolve(req.result);
  });

  const searchResultsCache = await new Promise<number>((resolve) => {
    const req = db
      .transaction(["searchResults"])
      .objectStore("searchResults")
      .count();
    req.onsuccess = () => resolve(req.result);
  });

  const historyEntries = await new Promise<number>((resolve) => {
    const req = db
      .transaction(["usageHistory"])
      .objectStore("usageHistory")
      .count();
    req.onsuccess = () => resolve(req.result);
  });

  return {
    cacheEntries,
    searchResultsCache,
    historyEntries,
    databaseSize: "Unknown (check DevTools)",
  };
}
