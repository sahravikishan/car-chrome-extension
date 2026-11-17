/**
 * Apex Cinema - IndexedDB Storage Engine for Custom User Wallpapers
 * Fully persistent across browser & PC restarts.
 */

const DB_NAME = 'ApexCinemaDB';
const DB_VERSION = 2;
const STORE_NAME = 'user_wallpapers';
const CACHE_STORE_NAME = 'optimized_cache';

class WallpaperDB {
  constructor() {
    this.db = null;
    this._initPromise = null;
  }

  async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
          const cacheStore = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' });
          cacheStore.createIndex('id', 'id', { unique: false });
          cacheStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open failed:', event.target.error);
        reject(event.target.error);
      };
    });
    return this._initPromise;
  }

  async addWallpaper({ name, category, blob, dataUrl, meta = 'Custom Upload' }) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const id = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      const record = {
        id,
        name,
        category,
        dataUrl, // persistent data string/dataUrl
        meta: meta || 'Custom User Upload • 4K Local Archive',
        camera: 'USER LOCAL IMPORT // RAW',
        createdAt: Date.now(),
        isCustom: true
      };

      const req = store.add(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllWallpapers() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getWallpaperById(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteWallpaper(id) {
    await this.init();
    await this.deleteOptimizedByWallpaperId(id);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async clearAllCustomWallpapers() {
    await this.init();
    await this.clearOptimizedCache();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // ==========================================================
  // OPTIMIZED WALLPAPER CACHE OPERATIONS
  // ==========================================================
  async getOptimized(key) {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction([CACHE_STORE_NAME], 'readonly');
        const store = tx.objectStore(CACHE_STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (e) => reject(e.target.error);
      } catch (err) {
        resolve(null);
      }
    });
  }

  async setOptimized(key, record) {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction([CACHE_STORE_NAME], 'readwrite');
        const store = tx.objectStore(CACHE_STORE_NAME);
        const req = store.put({ ...record, key, updatedAt: Date.now() });
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
      } catch (err) {
        resolve(false);
      }
    });
  }

  async deleteOptimized(key) {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction([CACHE_STORE_NAME], 'readwrite');
        const store = tx.objectStore(CACHE_STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
      } catch (err) {
        resolve(false);
      }
    });
  }

  async deleteOptimizedByWallpaperId(id) {
    await this.init();
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([CACHE_STORE_NAME], 'readwrite');
        const store = tx.objectStore(CACHE_STORE_NAME);
        const index = store.index('id');
        const req = index.getAllKeys(id);
        req.onsuccess = () => {
          const keys = req.result || [];
          keys.forEach(k => store.delete(k));
          resolve(true);
        };
        req.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  async clearOptimizedCache() {
    await this.init();
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([CACHE_STORE_NAME], 'readwrite');
        const store = tx.objectStore(CACHE_STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  async getStorageUsage() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  }
}

window.wallpaperDB = new WallpaperDB();
