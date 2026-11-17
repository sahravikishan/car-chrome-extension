/**
 * Cinematic New Tab - Central Wallpaper Registry & Management Service
 * 
 * Key Responsibilities:
 * 1. Centralized registry for all automotive wallpapers.
 * 2. Strict category management (Luxury Cars, Sports Cars, Classic Cars, Off-Road & SUVs).
 * 3. Dynamic real-time calculation of the MIX category (never manually duplicated).
 * 4. Image validation (format, duplicate IDs, asset paths, load testing).
 * 5. Reusable addWallpaper() and addWallpapersBatch() API for zero-friction future additions.
 * 6. Event subscription for automatic, reactive UI updates.
 * 7. Graceful error handling for missing/broken image assets.
 */

(function (root, factory) {
  const Service = factory();
  if (typeof root !== 'undefined') {
    root.WallpaperService = Service;
    root.wallpaperService = new Service();
    root.addWallpaper = function (entry) {
      return root.wallpaperService.addWallpaper(entry);
    };
    root.addWallpapersBatch = function (list) {
      return root.wallpaperService.addWallpapersBatch(list);
    };
  }
  if (typeof module === 'object' && module.exports) {
    module.exports = Service;
  }
}(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  // ==========================================================
  // CONFIGURATION & STRICT VALIDATION RULES
  // ==========================================================
  const VALID_CATEGORIES = Object.freeze([
    'Luxury Cars',
    'Sports Cars',
    'Classic Cars',
    'Off-Road & SUVs'
  ]);

  const CATEGORY_MIX = 'MIX';

  const FORBIDDEN_CATEGORIES = Object.freeze([
    'jdm',
    'jdm cars',
    'supercar',
    'supercars',
    'hypercar',
    'hypercars'
  ]);

  const SUPPORTED_EXTENSIONS = Object.freeze([
    'jpg',
    'jpeg',
    'png',
    'webp',
    'jfif'
  ]);

  class WallpaperService {
    constructor() {
      // Internal storage: id -> WallpaperRecord
      this._registry = new Map();
      this._listeners = new Set();
    }

    // ========================================================
    // 1. CATEGORY ACCESSORS & NORMALIZATION
    // ========================================================

    /**
     * Returns the exact list of supported individual categories.
     * @param {boolean} includeMix - If true, prepends 'MIX' to the list.
     * @returns {string[]}
     */
    getCategories(includeMix = true) {
      return includeMix ? [CATEGORY_MIX, ...VALID_CATEGORIES] : [...VALID_CATEGORIES];
    }

    /**
     * Normalizes flexible category input to standard category names.
     * e.g., 'luxury' -> 'Luxury Cars', 'sports' -> 'Sports Cars'
     */
    normalizeCategory(categoryInput) {
      if (!categoryInput || typeof categoryInput !== 'string') return null;
      const trimmed = categoryInput.trim();
      const lower = trimmed.toLowerCase();

      // Check forbidden categories
      if (FORBIDDEN_CATEGORIES.includes(lower)) {
        throw new Error(`Category "${categoryInput}" is strictly excluded. (JDM, Supercars, and Hypercars are prohibited).`);
      }

      if (lower === 'mix' || lower === 'all') return CATEGORY_MIX;

      for (const cat of VALID_CATEGORIES) {
        if (cat.toLowerCase() === lower) return cat;
      }

      // Shorthand aliases
      if (lower.startsWith('lux')) return 'Luxury Cars';
      if (lower.startsWith('sport')) return 'Sports Cars';
      if (lower.startsWith('classic')) return 'Classic Cars';
      if (lower.startsWith('off') || lower.includes('suv')) return 'Off-Road & SUVs';

      return null;
    }

    // ========================================================
    // 2. VALIDATION ENGINE
    // ========================================================

    /**
     * Validates a wallpaper configuration before registration.
     * @param {Object} config
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateWallpaper(config) {
      const errors = [];

      if (!config || typeof config !== 'object') {
        return { valid: false, errors: ['Wallpaper entry must be a valid object.'] };
      }

      // Check ID
      if (!config.id || typeof config.id !== 'string' || !config.id.trim()) {
        errors.push('Wallpaper "id" must be a non-empty string.');
      }

      // Check Name
      if (!config.name || typeof config.name !== 'string' || !config.name.trim()) {
        errors.push('Wallpaper "name" must be a non-empty string.');
      }

      // Check Category
      try {
        const normalizedCat = this.normalizeCategory(config.category);
        if (!normalizedCat || normalizedCat === CATEGORY_MIX) {
          errors.push(`Invalid category "${config.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}.`);
        }
      } catch (catError) {
        errors.push(catError.message);
      }

      // Check Source Path / Format
      if (!config.src || typeof config.src !== 'string' || !config.src.trim()) {
        errors.push('Wallpaper "src" path is required.');
      } else {
        const extMatch = config.src.trim().split('?')[0].split('.').pop();
        const ext = (extMatch || '').toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
          errors.push(`Unsupported file extension ".${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(', ')}.`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    /**
     * Asynchronously tests whether an image path loads successfully.
     * @param {string} src
     * @returns {Promise<{ success: boolean, width?: number, height?: number, error?: string }>}
     */
    testImageLoad(src) {
      return new Promise((resolve) => {
        if (!src) {
          resolve({ success: false, error: 'Empty source URL.' });
          return;
        }
        const img = new Image();
        img.onload = () => {
          resolve({ success: true, width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
          resolve({ success: false, error: `Failed to load image from: ${src}` });
        };
        img.src = src;
      });
    }

    // ========================================================
    // 3. REUSABLE REGISTRATION API
    // ========================================================

    /**
     * Adds or registers a single wallpaper in the central registry.
     * 
     * @param {Object} config
     * @param {string} config.id - Unique identifier.
     * @param {string} config.src - Path to image asset (e.g. assets/wallpapers/luxury/car.jpg).
     * @param {string} config.name - Display title (e.g. Mercedes-Maybach S 680).
     * @param {string} config.category - One of the 4 strict categories.
     * @param {string} [config.meta] - Automotive specifications.
     * @param {string} [config.camera] - Photography details.
     * @param {string} [config.description] - Additional background story.
     * @param {string} [config.mixSrc] - Optional mixup folder mirror path.
     * @param {string} [config.fallback] - Optional online fallback URL.
     * @param {Object} [options]
     * @param {boolean} [options.silent=false] - If true, avoids firing change events.
     * @param {boolean} [options.overwrite=false] - If true, allows updating existing ID.
     * @returns {{ success: boolean, wallpaper?: Object, error?: string }}
     */
    addWallpaper(config, options = {}) {
      const { silent = false, overwrite = false } = options;

      // 1. Validation
      const validation = this.validateWallpaper(config);
      if (!validation.valid) {
        const errorMsg = `[WallpaperService] Validation failed: ${validation.errors.join(' ')}`;
        console.error(errorMsg, config);
        return { success: false, error: errorMsg };
      }

      const id = config.id.trim();
      const normalizedCategory = this.normalizeCategory(config.category);

      // 2. Duplicate ID Check
      if (this._registry.has(id) && !overwrite) {
        const errorMsg = `[WallpaperService] Duplicate ID rejected: A wallpaper with id "${id}" already exists.`;
        console.debug(errorMsg);
        return { success: false, error: errorMsg };
      }

      // 3. Normalize Paths
      const cleanSrc = config.src.trim().replace(/\\/g, '/');
      const filename = cleanSrc.split('/').pop();
      const mixSrc = config.mixSrc ? config.mixSrc.trim().replace(/\\/g, '/') : `assets/wallpapers/mixup/${filename}`;

      // 4. Construct Final Normalized Wallpaper Record
      const record = {
        id: id,
        name: config.name.trim(),
        category: normalizedCategory,
        src: cleanSrc,
        mixSrc: mixSrc,
        meta: (config.meta || '').trim(),
        camera: (config.camera || '').trim(),
        description: (config.description || '').trim(),
        fallback: config.fallback || null,
        isBuiltin: config.isBuiltin !== false,
        registeredAt: config.registeredAt || Date.now()
      };

      // 5. Store in Registry
      this._registry.set(id, record);

      // 6. Notify Listeners
      if (!silent) {
        this._notify('add', record);
      }

      return { success: true, wallpaper: record };
    }

    /**
     * Batch registers an array of wallpapers.
     * @param {Object[]} list
     * @param {Object} [options]
     * @returns {{ added: number, errors: string[] }}
     */
    addWallpapersBatch(list, options = {}) {
      if (!Array.isArray(list)) {
        return { added: 0, errors: ['Expected an array of wallpaper objects.'] };
      }

      let added = 0;
      const errors = [];

      list.forEach((item, index) => {
        const res = this.addWallpaper(item, { ...options, silent: true });
        if (res.success) {
          added++;
        } else {
          errors.push(`Item #${index} (${item && item.id ? item.id : 'no-id'}): ${res.error}`);
        }
      });

      if (added > 0 && !options.silent) {
        this._notify('batch_add', { count: added });
      }

      return { added, errors };
    }

    /**
     * Safely removes a wallpaper from the registry by ID.
     * @param {string} id
     * @returns {boolean}
     */
    removeWallpaper(id) {
      if (!id || !this._registry.has(id)) return false;
      const removed = this._registry.get(id);
      this._registry.delete(id);
      this._notify('remove', removed);
      return true;
    }

    /**
     * Checks if an ID is already registered.
     * @param {string} id
     * @returns {boolean}
     */
    hasWallpaper(id) {
      return this._registry.has(id);
    }

    /**
     * Retrieves a single wallpaper by ID.
     * @param {string} id
     * @returns {Object|null}
     */
    getWallpaper(id) {
      return this._registry.get(id) || null;
    }

    // ========================================================
    // 4. QUERY & AUTOMATIC MIX DERIVATION
    // ========================================================

    /**
     * Returns an array of all registered wallpapers.
     * @returns {Object[]}
     */
    getAllWallpapers() {
      return Array.from(this._registry.values());
    }

    /**
     * Returns wallpapers by category.
     * When category is 'MIX', automatically returns ALL wallpapers from all 4 categories.
     * @param {string} category
     * @returns {Object[]}
     */
    getWallpapersByCategory(category) {
      const normalized = this.normalizeCategory(category);
      if (!normalized || normalized === CATEGORY_MIX) {
        // MIX is dynamically derived from all individual categories
        return this.getAllWallpapers();
      }
      return this.getAllWallpapers().filter(w => w.category === normalized);
    }

    /**
     * Returns dynamic counts of wallpapers for each category and MIX.
     * @returns {Object.<string, number>}
     */
    getCategoryCounts() {
      const all = this.getAllWallpapers();
      const counts = {
        [CATEGORY_MIX]: all.length
      };

      VALID_CATEGORIES.forEach(cat => {
        counts[cat] = 0;
      });

      all.forEach(w => {
        if (counts[w.category] !== undefined) {
          counts[w.category]++;
        }
      });

      return counts;
    }

    // ========================================================
    // 5. REACTIVE EVENT SUBSCRIPTIONS
    // ========================================================

    /**
     * Subscribes a listener to registry changes.
     * @param {Function} callback - Receives (event, data)
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
      if (typeof callback === 'function') {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
      }
      return () => {};
    }

    _notify(event, data) {
      this._listeners.forEach(fn => {
        try {
          fn(event, data);
        } catch (e) {
          console.error('[WallpaperService] Listener execution error:', e);
        }
      });
    }
  }

  // Expose Constants for reference
  WallpaperService.VALID_CATEGORIES = VALID_CATEGORIES;
  WallpaperService.CATEGORY_MIX = CATEGORY_MIX;
  WallpaperService.FORBIDDEN_CATEGORIES = FORBIDDEN_CATEGORIES;
  WallpaperService.SUPPORTED_EXTENSIONS = SUPPORTED_EXTENSIONS;

  return WallpaperService;
}));
