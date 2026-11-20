/**
 * Apex Cinema - Settings, Shortcuts & Favorites Persistence Manager
 * Uses chrome.storage.local with transparent localStorage fallback.
 */

const DEFAULT_SHORTCUTS = [
  {
    id: 'default-app-gmail',
    name: 'Gmail',
    url: 'https://mail.google.com/',
    icon: 'assets/icons/gmail.svg',
    color: '#ea4335'
  },
  {
    id: 'default-app-youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/',
    icon: 'assets/icons/youtube.svg',
    color: '#ff0000'
  },
  {
    id: 'default-app-github',
    name: 'GitHub',
    url: 'https://github.com/',
    icon: 'assets/icons/github.svg',
    color: '#24292e'
  },
  {
    id: 'default-app-x',
    name: 'X',
    url: 'https://x.com/',
    icon: 'assets/icons/x.svg',
    color: '#000000'
  },
  {
    id: 'default-app-instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/',
    icon: 'assets/icons/instagram.svg',
    color: '#e4405f'
  }
];

const DEFAULT_SETTINGS = {
  defaultCategory: 'MIX',
  randomOnNewTab: false,
  rotationInterval: '30s',  // 'none' | '10s' | '30s' | '1m' | '5m' | '15m'
  transitionEffect: 'fade', // 'fade' | 'zoom' | 'slide'
  fitMode: 'cover',         // 'cover' | 'contain'
  showCarTitle: true,
  showCounter: true,
  showTopNav: true,
  showBottomControls: true,
  showSearchBar: true,
  showAppDock: true,
  dockIconSize: 'medium',   // 'small' | 'medium' | 'large'
  activeCategory: 'MIX',
  lastWallpaperId: null,
  videoPlaybackMode: 'sequential', // 'sequential' (one after one) | 'loop' (loop current video)
  videoFitMode: 'cover',          // 'cover' | 'contain'
  videoClickToPause: true,
  categoryDisplayModes: {
    'Luxury Cars': { mode: 'sequence', selectedWallpaperId: null },
    'Sports Cars': { mode: 'sequence', selectedWallpaperId: null },
    'Classic Cars': { mode: 'sequence', selectedWallpaperId: null },
    'Off-Road & SUVs': { mode: 'sequence', selectedWallpaperId: null },
    'Videos': { mode: 'sequence', selectedWallpaperId: null },
    'MIX': { mode: 'sequence', selectedWallpaperId: null }
  },
  categoryProgress: {
    'Luxury Cars': { sequenceIndex: 0, shuffleHistory: [], lastWallpaperId: null },
    'Sports Cars': { sequenceIndex: 0, shuffleHistory: [], lastWallpaperId: null },
    'Classic Cars': { sequenceIndex: 0, shuffleHistory: [], lastWallpaperId: null },
    'Off-Road & SUVs': { sequenceIndex: 0, shuffleHistory: [], lastWallpaperId: null },
    'Videos': { sequenceIndex: 0, shuffleHistory: [], lastWallpaperId: null },
    'MIX': { sequenceIndex: 0, shuffleHistory: [], lastWallpaperId: null }
  }
};

class StorageManager {
  constructor() {
    this.isChromeStorageAvailable = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    this._settingsCache = null;
    this._savePromise = Promise.resolve();
  }

  /**
   * Recursively merges source object into target object, preserving nested keys.
   */
  _deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    const output = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  async getSettings() {
    if (this._settingsCache) {
      return JSON.parse(JSON.stringify(this._settingsCache));
    }

    return new Promise((resolve) => {
      if (this.isChromeStorageAvailable) {
        chrome.storage.local.get(['apex_settings'], (result) => {
          const loaded = this._deepMerge(DEFAULT_SETTINGS, result.apex_settings || {});
          this._settingsCache = loaded;
          resolve(JSON.parse(JSON.stringify(loaded)));
        });
      } else {
        try {
          const raw = localStorage.getItem('apex_settings');
          const parsed = raw ? JSON.parse(raw) : {};
          const loaded = this._deepMerge(DEFAULT_SETTINGS, parsed);
          this._settingsCache = loaded;
          resolve(JSON.parse(JSON.stringify(loaded)));
        } catch (e) {
          this._settingsCache = { ...DEFAULT_SETTINGS };
          resolve(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
        }
      }
    });
  }

  /**
   * Atomically saves settings using sequential queue to eliminate race conditions.
   */
  async saveSettings(partialSettings) {
    this._savePromise = this._savePromise.then(async () => {
      let current = this._settingsCache;
      if (!current) {
        current = await this.getSettings();
      }
      const updated = this._deepMerge(current, partialSettings);
      this._settingsCache = updated;

      return new Promise((resolve) => {
        if (this.isChromeStorageAvailable) {
          chrome.storage.local.set({ apex_settings: updated }, () => {
            resolve(JSON.parse(JSON.stringify(updated)));
          });
        } else {
          try {
            localStorage.setItem('apex_settings', JSON.stringify(updated));
          } catch (e) {}
          resolve(JSON.parse(JSON.stringify(updated)));
        }
      });
    });

    return this._savePromise;
  }

  async resetSettings() {
    this._settingsCache = null;
    return this.saveSettings(DEFAULT_SETTINGS);
  }

  // ==========================================
  // APP SHORTCUTS (DOCK)
  // ==========================================
  async getShortcuts() {
    return new Promise((resolve) => {
      if (this.isChromeStorageAvailable) {
        chrome.storage.local.get(['apex_shortcuts'], (result) => {
          // If user already has a saved configuration (even an empty list), preserve it
          if (result && Array.isArray(result.apex_shortcuts)) {
            resolve(result.apex_shortcuts);
          } else {
            // First-time initialization: save defaults into storage so they persist
            const initialList = [...DEFAULT_SHORTCUTS];
            chrome.storage.local.set({ apex_shortcuts: initialList }, () => {
              resolve(initialList);
            });
          }
        });
      } else {
        try {
          const raw = localStorage.getItem('apex_shortcuts');
          if (raw !== null) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              resolve(parsed);
              return;
            }
          }
          // First-time initialization in localStorage
          const initialList = [...DEFAULT_SHORTCUTS];
          localStorage.setItem('apex_shortcuts', JSON.stringify(initialList));
          resolve(initialList);
        } catch (e) {
          resolve([...DEFAULT_SHORTCUTS]);
        }
      }
    });
  }

  async saveShortcuts(shortcutsList) {
    return new Promise((resolve) => {
      if (this.isChromeStorageAvailable) {
        chrome.storage.local.set({ apex_shortcuts: shortcutsList }, () => resolve(shortcutsList));
      } else {
        localStorage.setItem('apex_shortcuts', JSON.stringify(shortcutsList));
        resolve(shortcutsList);
      }
    });
  }

  async addShortcut({ name, url, icon, color }) {
    const list = await this.getShortcuts();
    const id = 'app-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const domain = this.extractDomain(url);
    const autoIcon = icon || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    const newShortcut = {
      id,
      name: name.trim(),
      url: this.normalizeUrl(url),
      icon: autoIcon,
      color: color || '#d4af37'
    };

    list.push(newShortcut);
    await this.saveShortcuts(list);
    return newShortcut;
  }

  async updateShortcut(id, { name, url, icon, color }) {
    const list = await this.getShortcuts();
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;

    const domain = this.extractDomain(url);
    const autoIcon = icon || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    list[index] = {
      ...list[index],
      name: name.trim(),
      url: this.normalizeUrl(url),
      icon: autoIcon,
      color: color || list[index].color || '#d4af37'
    };

    await this.saveShortcuts(list);
    return list[index];
  }

  async deleteShortcut(id) {
    const list = await this.getShortcuts();
    const filtered = list.filter(item => item.id !== id);
    await this.saveShortcuts(filtered);
    return filtered;
  }

  async resetShortcuts() {
    return this.saveShortcuts([...DEFAULT_SHORTCUTS]);
  }

  // ==========================================
  // FAVORITES
  // ==========================================
  async getFavorites() {
    return new Promise((resolve) => {
      if (this.isChromeStorageAvailable) {
        chrome.storage.local.get(['apex_favorites'], (result) => {
          resolve(result.apex_favorites || []);
        });
      } else {
        try {
          const raw = localStorage.getItem('apex_favorites');
          resolve(raw ? JSON.parse(raw) : []);
        } catch (e) {
          resolve([]);
        }
      }
    });
  }

  async saveFavorites(favList) {
    return new Promise((resolve) => {
      if (this.isChromeStorageAvailable) {
        chrome.storage.local.set({ apex_favorites: favList }, () => resolve(favList));
      } else {
        localStorage.setItem('apex_favorites', JSON.stringify(favList));
        resolve(favList);
      }
    });
  }

  async isFavorite(wallpaperId) {
    const favs = await this.getFavorites();
    return favs.some(item => (typeof item === 'string' ? item : item.id) === wallpaperId);
  }

  async toggleFavorite(wallpaper) {
    const favs = await this.getFavorites();
    const targetId = wallpaper.id;
    const existingIndex = favs.findIndex(item => (typeof item === 'string' ? item : item.id) === targetId);

    if (existingIndex > -1) {
      favs.splice(existingIndex, 1);
      await this.saveFavorites(favs);
      return false; // Removed
    } else {
      favs.unshift({
        id: wallpaper.id,
        name: wallpaper.name,
        category: wallpaper.category,
        src: wallpaper.src || wallpaper.dataUrl,
        meta: wallpaper.meta || '',
        camera: wallpaper.camera || '',
        isCustom: !!wallpaper.isCustom
      });
      await this.saveFavorites(favs);
      return true; // Added
    }
  }

  async clearFavorites() {
    return this.saveFavorites([]);
  }

  // ==========================================
  // DELETED WALLPAPERS TRACKING & SANITIZATION
  // ==========================================
  async getDeletedWallpaperIds() {
    return new Promise((resolve) => {
      if (this.isChromeStorageAvailable) {
        chrome.storage.local.get(['apex_deleted_wallpapers'], (result) => {
          resolve(result.apex_deleted_wallpapers || []);
        });
      } else {
        try {
          const raw = localStorage.getItem('apex_deleted_wallpapers');
          resolve(raw ? JSON.parse(raw) : []);
        } catch (e) {
          resolve([]);
        }
      }
    });
  }

  async markWallpaperDeleted(wallpaperId) {
    if (!wallpaperId) return;
    const deletedList = await this.getDeletedWallpaperIds();
    if (!deletedList.includes(wallpaperId)) {
      deletedList.push(wallpaperId);
      if (this.isChromeStorageAvailable) {
        await new Promise((r) => chrome.storage.local.set({ apex_deleted_wallpapers: deletedList }, r));
      } else {
        try { localStorage.setItem('apex_deleted_wallpapers', JSON.stringify(deletedList)); } catch (e) {}
      }
    }

    // Safely clear all references in favorites
    const favs = await this.getFavorites();
    const cleanFavs = favs.filter(f => (typeof f === 'string' ? f : f.id) !== wallpaperId);
    if (cleanFavs.length !== favs.length) {
      await this.saveFavorites(cleanFavs);
    }

    // Safely clear all references in saved settings (lastWallpaperId, categoryDisplayModes, categoryProgress)
    const settings = await this.getSettings();
    let settingsModified = false;

    if (settings.lastWallpaperId === wallpaperId) {
      settings.lastWallpaperId = null;
      settingsModified = true;
    }

    if (settings.categoryDisplayModes) {
      for (const cat of Object.keys(settings.categoryDisplayModes)) {
        if (settings.categoryDisplayModes[cat].selectedWallpaperId === wallpaperId) {
          settings.categoryDisplayModes[cat].selectedWallpaperId = null;
          settingsModified = true;
        }
      }
    }

    if (settings.categoryProgress) {
      for (const cat of Object.keys(settings.categoryProgress)) {
        const prog = settings.categoryProgress[cat];
        if (prog.lastWallpaperId === wallpaperId) {
          prog.lastWallpaperId = null;
          settingsModified = true;
        }
        if (Array.isArray(prog.shuffleHistory) && prog.shuffleHistory.includes(wallpaperId)) {
          prog.shuffleHistory = prog.shuffleHistory.filter(id => id !== wallpaperId);
          settingsModified = true;
        }
      }
    }

    if (settingsModified) {
      await this.saveSettings(settings);
    }
  }

  async unmarkWallpaperDeleted(wallpaperId) {
    if (!wallpaperId) return;
    const deletedList = await this.getDeletedWallpaperIds();
    const filtered = deletedList.filter(id => id !== wallpaperId);
    if (this.isChromeStorageAvailable) {
      await new Promise((r) => chrome.storage.local.set({ apex_deleted_wallpapers: filtered }, r));
    } else {
      try { localStorage.setItem('apex_deleted_wallpapers', JSON.stringify(filtered)); } catch (e) {}
    }
  }

  // Helpers
  normalizeUrl(input) {
    let url = input.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }

  extractDomain(input) {
    try {
      const url = this.normalizeUrl(input);
      const parsed = new URL(url);
      return parsed.hostname;
    } catch (e) {
      return input.replace(/https?:\/\//i, '').split('/')[0];
    }
  }
}

window.storageManager = new StorageManager();
