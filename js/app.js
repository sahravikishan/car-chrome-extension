/**
 * Cinematic New Tab - Minimal Architecture
 * Strictly 2 Visible Elements: Top Search Bar + Bottom App Dock
 * Manifest V3, Pure Vanilla JavaScript, Zero Dependencies, Offline Ready
 */

(function () {
  'use strict';

  // State Management
  const state = {
    settings: {},
    shortcuts: [],
    activeCategory: 'MIX',
    currentList: [],
    currentIndex: 0,
    currentWallpaper: null,
    userWallpapers: [],
    favorites: [],
    activeTab: 'categories',
    activeLayer: 'a',
    exploreFilterCat: 'MIX',
    exploreSearchQuery: '',
    draggedShortcutId: null,
    speechRecognition: null,
    isListening: false,
    wallpaperLoadToken: 0,
    deletedWallpaperIds: new Set()
  };

  // DOM Elements Cache
  const DOM = {};

  function initDOMCache() {
    DOM.viewportCanvas = document.getElementById('viewport-canvas');
    DOM.layerA = document.getElementById('wallpaper-layer-a');
    DOM.layerB = document.getElementById('wallpaper-layer-b');
    DOM.searchBarContainer = document.getElementById('search-bar-container');
    DOM.searchBarGlass = document.getElementById('search-bar-glass');
    DOM.searchInput = document.getElementById('search-text-input');
    DOM.searchClearBtn = document.getElementById('search-clear-btn');
    DOM.searchMicBtn = document.getElementById('search-mic-btn');
    DOM.dockContainer = document.getElementById('dock-container-wrapper');
    DOM.appShortcutsDock = document.getElementById('app-shortcuts-dock');
    DOM.btnOpenMenu = document.getElementById('btn-open-menu');
    DOM.toast = document.getElementById('cinema-toast');
    DOM.toastMsg = document.getElementById('toast-msg');

    // Hub Modal & Tabs
    DOM.viewHubModal = document.getElementById('view-hub-modal');
    DOM.btnCloseHub = document.getElementById('btn-close-hub');
    DOM.hubCarTitle = document.getElementById('hub-car-title');
    DOM.hubCarSpecs = document.getElementById('hub-car-specs');
    DOM.hubBtnPrev = document.getElementById('hub-btn-prev');
    DOM.hubBtnRandom = document.getElementById('hub-btn-random');
    DOM.hubBtnNext = document.getElementById('hub-btn-next');
    DOM.hubBtnFav = document.getElementById('hub-btn-fav');

    // Shortcut Modal
    DOM.viewShortcutModal = document.getElementById('view-shortcut-modal');
    DOM.shortcutModalTitle = document.getElementById('shortcut-modal-title');
    DOM.editShortcutId = document.getElementById('edit-shortcut-id');
    DOM.shortcutNameInput = document.getElementById('shortcut-name-input');
    DOM.shortcutUrlInput = document.getElementById('shortcut-url-input');
    DOM.shortcutPreviewImg = document.getElementById('shortcut-preview-img');
    DOM.shortcutPreviewName = document.getElementById('shortcut-preview-name');
    DOM.btnDeleteShortcut = document.getElementById('btn-delete-shortcut');
    DOM.btnCancelShortcut = document.getElementById('btn-cancel-shortcut');
    DOM.btnSaveShortcut = document.getElementById('btn-save-shortcut');
    DOM.btnCloseShortcutModal = document.getElementById('btn-close-shortcut-modal');

    // Explore inside Hub
    DOM.exploreSearchInput = document.getElementById('explore-search-input');
    DOM.exploreGalleryGrid = document.getElementById('explore-gallery-grid');

    // Uploads inside Hub
    DOM.uploadDropzone = document.getElementById('upload-dropzone');
    DOM.filePickerInput = document.getElementById('file-picker-input');
    DOM.uploadCustomTitle = document.getElementById('upload-custom-title');
    DOM.uploadCategoryAssign = document.getElementById('upload-category-assign');
    DOM.userGalleryGrid = document.getElementById('user-gallery-grid');
    DOM.userWallpaperCount = document.getElementById('user-wallpaper-count');
    DOM.dbStorageStat = document.getElementById('db-storage-stat');

    // Favorites inside Hub
    DOM.favoritesGalleryGrid = document.getElementById('favorites-gallery-grid');
    DOM.favCounterBadge = document.getElementById('fav-counter-badge');
    DOM.btnClearAllFavs = document.getElementById('btn-clear-all-favs');

    // Settings inside Hub
    DOM.toggleShowSearchBar = document.getElementById('toggle-show-searchbar');
    DOM.toggleShowAppDock = document.getElementById('toggle-show-appdock');
    DOM.settingDockSize = document.getElementById('setting-dock-size');
    DOM.btnResetShortcuts = document.getElementById('btn-reset-shortcuts');
    DOM.settingDefaultCat = document.getElementById('setting-default-cat');
    DOM.settingFitMode = document.getElementById('setting-fit-mode');
    DOM.settingTransitionStyle = document.getElementById('setting-transition-style');
    DOM.toggleRandomTab = document.getElementById('toggle-random-tab');
    DOM.btnSettingsClearDB = document.getElementById('btn-settings-clear-db');
    DOM.btnSettingsReset = document.getElementById('btn-settings-reset');
    DOM.settingRotationInterval = document.getElementById('setting-rotation-interval');
    DOM.categoryDisplayModesCard = document.getElementById('category-display-modes-card');
  }

  // ==========================================================
  // TOP HORIZONTAL SEARCH BAR (TRANSPARENT 2% GLASS)
  // ==========================================================
  function setupSearchBar() {
    const input = DOM.searchInput;
    const glass = DOM.searchBarGlass;
    const clearBtn = DOM.searchClearBtn;
    const micBtn = DOM.searchMicBtn;

    input.addEventListener('focus', () => glass.classList.add('focused'));
    input.addEventListener('blur', () => glass.classList.remove('focused'));

    input.addEventListener('input', () => {
      clearBtn.classList.toggle('visible', input.value.trim().length > 0);
    });

    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      input.value = '';
      clearBtn.classList.remove('visible');
      input.focus();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearchOrNavigate(input.value);
      }
    });

    // Voice search
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      state.speechRecognition = new SpeechRecognition();
      state.speechRecognition.continuous = false;
      state.speechRecognition.interimResults = false;
      state.speechRecognition.lang = 'en-US';

      state.speechRecognition.onstart = () => {
        state.isListening = true;
        micBtn.classList.add('listening');
        showToast('Listening...');
      };

      state.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        clearBtn.classList.add('visible');
        executeSearchOrNavigate(transcript);
      };

      state.speechRecognition.onerror = (event) => {
        stopListening();
        showToast(`Voice error: ${event.error}`);
      };

      state.speechRecognition.onend = () => {
        stopListening();
      };

      micBtn.addEventListener('click', () => {
        if (!state.isListening) {
          try {
            state.speechRecognition.start();
          } catch (e) {
            console.debug(e);
          }
        } else {
          stopListening();
        }
      });
    } else {
      micBtn.title = 'Voice search not supported';
      micBtn.style.opacity = '0.35';
    }
  }

  function stopListening() {
    state.isListening = false;
    DOM.searchMicBtn.classList.remove('listening');
    if (state.speechRecognition) {
      try { state.speechRecognition.stop(); } catch (e) {}
    }
  }

  function executeSearchOrNavigate(rawQuery) {
    const query = rawQuery.trim();
    if (!query) return;

    if (isURL(query)) {
      let targetUrl = query;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      window.location.href = targetUrl;
    } else {
      const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(query);
      window.location.href = searchUrl;
    }
  }

  function isURL(str) {
    if (/\s/.test(str)) return false;
    if (/^https?:\/\//i.test(str)) return true;
    if (/^localhost(:\d+)?(\/.*)?$/i.test(str)) return true;
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/.test(str)) return true;
    const domainRegex = /^([a-zA-Z0-9][-a-zA-Z0-9]*\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
    return domainRegex.test(str);
  }

  // ==========================================================
  // BOTTOM HORIZONTAL APPLICATION DOCK (INDEPENDENT ICONS)
  // ==========================================================
  let activeSelectedShortcutId = null;
  let isDraggingShortcut = false;

  function clearSelectedShortcut() {
    activeSelectedShortcutId = null;
    document.querySelectorAll('.dock-item').forEach(el => {
      el.classList.remove('selected-shortcut');
    });
  }

  // Clear selected shortcut on clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dock-item')) {
      clearSelectedShortcut();
    }
  });

  async function renderAppDock() {
    state.shortcuts = await window.storageManager.getShortcuts();
    const dock = DOM.appShortcutsDock;
    dock.innerHTML = '';
    activeSelectedShortcutId = null;

    state.shortcuts.forEach((shortcut) => {
      const item = document.createElement('div');
      item.className = 'dock-item';
      item.setAttribute('draggable', 'true');
      item.setAttribute('data-id', shortcut.id);

      const domain = window.storageManager.extractDomain(shortcut.url);
      let faviconUrl = shortcut.icon;
      if (shortcut.id === 'default-app-gmail') {
        faviconUrl = 'assets/icons/gmail.svg';
      } else if (!faviconUrl) {
        faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }

      item.innerHTML = `
        <div class="dock-tooltip">${shortcut.name}</div>
        <button class="dock-remove-badge" title="Remove ${shortcut.name}">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="dock-icon-box">
          <img class="dock-icon-img" src="${faviconUrl}" alt="${shortcut.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="dock-icon-fallback" style="display:none; background:${shortcut.color || '#333'};">
            ${shortcut.name.charAt(0)}
          </div>
        </div>
      `;

      // 1. Single click: select shortcut & display remove (×) button (DO NOT open website)
      item.addEventListener('click', (e) => {
        if (isDraggingShortcut) return;
        if (e.target.closest('.dock-remove-badge')) return;
        e.stopPropagation();

        if (activeSelectedShortcutId === shortcut.id) {
          clearSelectedShortcut();
          return;
        }

        clearSelectedShortcut();
        activeSelectedShortcutId = shortcut.id;
        item.classList.add('selected-shortcut');
      });

      // 2. Double click: open website in current tab
      item.addEventListener('dblclick', (e) => {
        if (isDraggingShortcut) return;
        if (e.target.closest('.dock-remove-badge')) return;
        e.preventDefault();
        e.stopPropagation();
        window.location.href = shortcut.url;
      });

      // 3. Remove (×) button click
      const removeBadge = item.querySelector('.dock-remove-badge');
      if (removeBadge) {
        removeBadge.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (confirm(`Remove "${shortcut.name}" from your shortcuts?`)) {
            await window.storageManager.deleteShortcut(shortcut.id);
            clearSelectedShortcut();
            renderAppDock();
            showToast(`Removed ${shortcut.name}`);
          }
        });
      }

      setupDragAndDrop(item);
      dock.appendChild(item);
    });

    // 4. PLUS (+) Add App Icon — MUST ALWAYS remain visible as LAST item
    const addBtn = document.createElement('div');
    addBtn.className = 'dock-add-btn';
    addBtn.id = 'btn-dock-add-app';
    addBtn.title = 'Add App Shortcut';
    addBtn.setAttribute('draggable', 'false');
    addBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSelectedShortcut();
      openAddShortcutModal();
    });
    dock.appendChild(addBtn);

    applyDockSizeSetting();
  }

  function setupDragAndDrop(element) {
    element.addEventListener('dragstart', (e) => {
      isDraggingShortcut = true;
      clearSelectedShortcut();
      state.draggedShortcutId = element.getAttribute('data-id');
      element.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', state.draggedShortcutId);
    });

    element.addEventListener('dragend', () => {
      element.classList.remove('dragging');
      document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('drag-over'));
      setTimeout(() => {
        isDraggingShortcut = false;
      }, 120);
    });

    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.dock-item');
      if (target && target !== element) {
        target.classList.add('drag-over');
      }
    });

    element.addEventListener('dragleave', (e) => {
      const target = e.target.closest('.dock-item');
      if (target) target.classList.remove('drag-over');
    });

    element.addEventListener('drop', async (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');
      const targetId = element.getAttribute('data-id');
      const sourceId = state.draggedShortcutId;

      if (!sourceId || sourceId === targetId) return;

      const sourceIdx = state.shortcuts.findIndex(s => s.id === sourceId);
      const targetIdx = state.shortcuts.findIndex(s => s.id === targetId);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const [movedItem] = state.shortcuts.splice(sourceIdx, 1);
        state.shortcuts.splice(targetIdx, 0, movedItem);
        await window.storageManager.saveShortcuts(state.shortcuts);
        renderAppDock();
        showToast('Shortcuts reordered');
      }
    });
  }

  function applyDockSizeSetting() {
    const size = state.settings.dockIconSize || 'medium';
    let px = '52px';
    if (size === 'small') px = '44px';
    if (size === 'large') px = '60px';
    document.documentElement.style.setProperty('--dock-size', px);
  }

  // ==========================================================
  // ADD / EDIT SHORTCUT MODAL
  // ==========================================================
  function openAddShortcutModal() {
    DOM.shortcutModalTitle.innerHTML = '<i class="fa-solid fa-plus" style="color:var(--cinema-gold);"></i> Add App Shortcut';
    DOM.editShortcutId.value = '';
    DOM.shortcutNameInput.value = '';
    DOM.shortcutUrlInput.value = '';
    DOM.btnDeleteShortcut.style.display = 'none';
    updateFaviconPreview('https://google.com', 'Google');
    DOM.viewShortcutModal.classList.add('open');
    DOM.shortcutNameInput.focus();
  }

  function openEditShortcutModal(shortcut) {
    DOM.shortcutModalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color:var(--cinema-gold);"></i> Edit App Shortcut';
    DOM.editShortcutId.value = shortcut.id;
    DOM.shortcutNameInput.value = shortcut.name;
    DOM.shortcutUrlInput.value = shortcut.url;
    DOM.btnDeleteShortcut.style.display = 'inline-flex';
    updateFaviconPreview(shortcut.url, shortcut.name);
    DOM.viewShortcutModal.classList.add('open');
    DOM.shortcutNameInput.focus();
  }

  function closeShortcutModal() {
    DOM.viewShortcutModal.classList.remove('open');
  }

  function updateFaviconPreview(url, name) {
    const domain = window.storageManager.extractDomain(url || 'google.com');
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    DOM.shortcutPreviewImg.src = faviconUrl;
    DOM.shortcutPreviewName.textContent = name || domain;
  }

  function setupShortcutModalListeners() {
    DOM.shortcutUrlInput.addEventListener('input', () => {
      const url = DOM.shortcutUrlInput.value;
      const name = DOM.shortcutNameInput.value;
      if (url.trim()) {
        updateFaviconPreview(url, name);
      }
    });

    DOM.shortcutNameInput.addEventListener('input', () => {
      const url = DOM.shortcutUrlInput.value;
      const name = DOM.shortcutNameInput.value;
      updateFaviconPreview(url, name);
    });

    DOM.btnCancelShortcut.addEventListener('click', closeShortcutModal);
    DOM.btnCloseShortcutModal.addEventListener('click', closeShortcutModal);

    DOM.btnSaveShortcut.addEventListener('click', async () => {
      const name = DOM.shortcutNameInput.value.trim();
      const rawUrl = DOM.shortcutUrlInput.value.trim();
      const id = DOM.editShortcutId.value;

      if (!name) {
        showToast('Please enter an app name');
        DOM.shortcutNameInput.focus();
        return;
      }
      if (!rawUrl) {
        showToast('Please enter a website URL');
        DOM.shortcutUrlInput.focus();
        return;
      }

      const url = window.storageManager.normalizeUrl(rawUrl);

      if (id) {
        await window.storageManager.updateShortcut(id, { name, url });
        showToast(`Updated: ${name}`);
      } else {
        await window.storageManager.addShortcut({ name, url });
        showToast(`Added: ${name}`);
      }

      closeShortcutModal();
      renderAppDock();
    });

    DOM.btnDeleteShortcut.addEventListener('click', async () => {
      const id = DOM.editShortcutId.value;
      if (id && confirm('Delete this application shortcut?')) {
        await window.storageManager.deleteShortcut(id);
        closeShortcutModal();
        renderAppDock();
        showToast('Shortcut removed');
      }
    });
  }

  // ==========================================================
  // CAR WALLPAPER & CATEGORIES ENGINE (EXACT 5 CATEGORIES)
  // ==========================================================
  function getAllAvailableWallpapers() {
    const builtins = window.wallpaperService 
      ? window.wallpaperService.getAllWallpapers() 
      : (window.BUILTIN_WALLPAPERS || []);
    const customs = state.userWallpapers || [];
    const all = [...builtins, ...customs];
    if (state.deletedWallpaperIds && state.deletedWallpaperIds.size > 0) {
      return all.filter(item => !state.deletedWallpaperIds.has(item.id));
    }
    return all;
  }

  function getWallpapersByCategory(category) {
    if (category === 'MIX') {
      return getAllAvailableWallpapers();
    }
    const builtins = window.wallpaperService 
      ? window.wallpaperService.getWallpapersByCategory(category) 
      : (window.BUILTIN_WALLPAPERS || []).filter(item => item.category === category);
    const customs = (state.userWallpapers || []).filter(item => item.category === category);
    const all = [...builtins, ...customs];
    if (state.deletedWallpaperIds && state.deletedWallpaperIds.size > 0) {
      return all.filter(item => !state.deletedWallpaperIds.has(item.id));
    }
    return all;
  }

  /**
   * Permanently deletes a wallpaper from the active collection.
   * Ensures it is removed from active registry, all 5 categories, galleries,
   * display modes, favorites, and settings, and that backups/old copies are never used.
   */
  async function deleteActiveWallpaper(wallpaperId) {
    if (!wallpaperId) return;

    // 1. Mark in storageManager (clears references in settings, categoryDisplayModes, categoryProgress, favorites)
    await window.storageManager.markWallpaperDeleted(wallpaperId);
    if (!state.deletedWallpaperIds) state.deletedWallpaperIds = new Set();
    state.deletedWallpaperIds.add(wallpaperId);

    // 2. Remove from active WallpaperService registry
    if (window.wallpaperService) {
      window.wallpaperService.removeWallpaper(wallpaperId);
    }

    // 3. Remove from custom uploads in IndexedDB if custom
    if (window.wallpaperDB) {
      try {
        await window.wallpaperDB.deleteWallpaper(wallpaperId);
      } catch (e) {}
    }

    // 4. Invalidate all cached versions in ImageOptimizer
    if (window.imageOptimizer) {
      try {
        await window.imageOptimizer.invalidateWallpaper(wallpaperId);
      } catch (e) {}
    }

    // 5. Update state arrays
    state.userWallpapers = (state.userWallpapers || []).filter(w => w.id !== wallpaperId);
    state.favorites = (state.favorites || []).filter(f => (typeof f === 'string' ? f : f.id) !== wallpaperId);

    // 6. Refresh current category list
    refreshCurrentList();

    // 7. If currently rendering the deleted wallpaper, transition to next valid image
    if (state.currentWallpaper && state.currentWallpaper.id === wallpaperId) {
      if (state.currentList.length > 0) {
        state.currentIndex = Math.min(state.currentIndex, state.currentList.length - 1);
        renderWallpaper(state.currentList[state.currentIndex], true);
      } else {
        // Active category is now empty, switch to MIX
        state.activeCategory = 'MIX';
        refreshCurrentList();
        if (state.currentList.length > 0) {
          state.currentIndex = 0;
          renderWallpaper(state.currentList[0], true);
        }
      }
    }

    // 8. Re-render UI views if active
    updateFavoriteButtonState();
    syncCategoryUI();
    if (state.activeTab === 'explore') renderExploreView();
    if (state.activeTab === 'uploads') renderMyWallpapersView();
    if (state.activeTab === 'favorites') renderFavoritesView();
    if (state.activeTab === 'settings') renderSettingsView();
  }

  function refreshCurrentList(preserveCurrent = false) {
    state.currentList = getWallpapersByCategory(state.activeCategory);
    
    if (state.currentList.length === 0) {
      state.currentList = getAllAvailableWallpapers();
    }

    if (preserveCurrent && state.currentWallpaper) {
      const foundIdx = state.currentList.findIndex(item => item.id === state.currentWallpaper.id);
      state.currentIndex = foundIdx !== -1 ? foundIdx : 0;
    } else {
      if (state.currentIndex >= state.currentList.length) {
        state.currentIndex = 0;
      }
    }

    updateHubQuickBar();
  }

  async function renderWallpaper(wallpaper, animate = true) {
    if (!wallpaper) return;

    // Check if this wallpaper was deleted - never display a deleted wallpaper!
    if (state.deletedWallpaperIds && state.deletedWallpaperIds.has(wallpaper.id)) {
      const nextValid = (state.currentList || []).find(w => !state.deletedWallpaperIds.has(w.id));
      if (nextValid && nextValid.id !== wallpaper.id) {
        renderWallpaper(nextValid, animate);
      }
      return;
    }

    state.currentWallpaper = wallpaper;

    // Concurrency token to cancel stale asynchronous loads on rapid user clicks
    state.wallpaperLoadToken = (state.wallpaperLoadToken || 0) + 1;
    const currentToken = state.wallpaperLoadToken;

    // 1. Resolve optimized display URL via ImageOptimizer
    let displayUrl = wallpaper.src || wallpaper.dataUrl || '';
    let isPredecoded = false;

    if (window.imageOptimizer) {
      try {
        const opt = await window.imageOptimizer.getWallpaperDisplayUrl(wallpaper);
        if (opt && opt.url) {
          displayUrl = opt.url;
          isPredecoded = !!opt.isPredecoded;
        }
      } catch (err) {
        // Graceful fallback to raw URL without triggering Chrome extension error badge
      }
    }

    // Abort if user navigated away while resolving
    if (currentToken !== state.wallpaperLoadToken) return;

    // 2. Pre-decode into GPU memory if not already pre-decoded
    if (!isPredecoded) {
      const decodeImg = new Image();
      decodeImg.src = displayUrl;
      if (typeof decodeImg.decode === 'function') {
        try {
          await decodeImg.decode();
        } catch (decodeErr) {
          // If user clicked Next / Prev while decoding, ignore abort silently
          if (currentToken !== state.wallpaperLoadToken) return;

          // If image failed to load because file is missing on disk:
          if (decodeImg.naturalWidth === 0) {
            await deleteActiveWallpaper(wallpaper.id);
            const fallbackWp = (state.currentList || []).find(w => w.id !== wallpaper.id && (!state.deletedWallpaperIds || !state.deletedWallpaperIds.has(w.id)));
            if (fallbackWp) {
              renderWallpaper(fallbackWp, animate);
            }
            return;
          }
        }
      }
    }

    // Abort if user clicked Next / Prev while decoding
    if (currentToken !== state.wallpaperLoadToken) return;

    const outgoing = state.activeLayer === 'a' ? DOM.layerA : DOM.layerB;
    const incoming = state.activeLayer === 'a' ? DOM.layerB : DOM.layerA;
    state.activeLayer = state.activeLayer === 'a' ? 'b' : 'a';

    const fitMode = state.settings.fitMode || 'cover';
    const transition = state.settings.transitionEffect || 'fade';

    incoming.style.backgroundImage = `url("${displayUrl}")`;
    incoming.style.backgroundSize = fitMode;

    incoming.classList.remove('transition-zoom', 'transition-slide');
    if (animate) {
      if (transition === 'zoom') incoming.classList.add('transition-zoom');
      if (transition === 'slide') incoming.classList.add('transition-slide');
    }

    incoming.classList.add('incoming');
    requestAnimationFrame(() => {
      if (currentToken !== state.wallpaperLoadToken) return;
      incoming.classList.add('active');
      incoming.classList.remove('incoming');
      outgoing.classList.remove('active');
      setTimeout(() => {
        incoming.classList.remove('transition-zoom', 'transition-slide');
      }, 800);
    });

    updateHubQuickBar();
    syncCategoryUI();
    window.storageManager.saveSettings({ lastWallpaperId: wallpaper.id });

    // 3. Intelligent Predictive Preload for the upcoming wallpaper
    schedulePredictivePreload();
  }

  function schedulePredictivePreload() {
    if (!window.imageOptimizer || !state.currentList || state.currentList.length <= 1) return;

    const cat = state.activeCategory || 'MIX';
    const modeConfig = getCategoryModeSettings(cat);
    const mode = modeConfig.mode || 'sequence';

    if (mode === 'single') return; // Single image mode does not need preloading

    const runPreload = () => {
      let targetWp = null;
      if (mode === 'shuffle') {
        const progress = getCategoryProgress(cat);
        const history = progress.shuffleHistory || [];
        const unshown = state.currentList.filter(w => !history.includes(w.id));
        const pool = unshown.length > 0 ? unshown : state.currentList;
        targetWp = pool.find(w => w.id !== (state.currentWallpaper && state.currentWallpaper.id)) || pool[0];
      } else {
        const nextIdx = (state.currentIndex + 1) % state.currentList.length;
        targetWp = state.currentList[nextIdx];
      }

      if (targetWp) {
        window.imageOptimizer.preloadWallpaper(targetWp).catch(() => {});
      }
    };

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(runPreload, { timeout: 1500 });
    } else {
      setTimeout(runPreload, 100);
    }
  }

  // Timer reference for automatic wallpaper playback/rotation
  let wallpaperRotationTimer = null;

  function getIntervalMs(intervalStr) {
    switch (intervalStr) {
      case '10s': return 10 * 1000;
      case '30s': return 30 * 1000;
      case '1m': return 60 * 1000;
      case '5m': return 5 * 60 * 1000;
      case '15m': return 15 * 60 * 1000;
      default: return 0; // 'none'
    }
  }

  function stopWallpaperRotationTimer() {
    if (wallpaperRotationTimer) {
      clearInterval(wallpaperRotationTimer);
      wallpaperRotationTimer = null;
    }
  }

  function startWallpaperRotationTimer() {
    stopWallpaperRotationTimer();

    const cat = state.activeCategory || 'MIX';
    const modeConfig = getCategoryModeSettings(cat);
    const mode = modeConfig.mode || 'sequence';

    // Single Image Mode remains permanently locked to chosen image (no timer)
    if (mode === 'single') return;

    const ms = getIntervalMs(state.settings.rotationInterval || '30s');
    if (ms <= 0) return; // Automatic timer disabled

    wallpaperRotationTimer = setInterval(() => {
      if (document.hidden) return;
      if (!state.currentList || state.currentList.length <= 1) return;

      const currentCat = state.activeCategory || 'MIX';
      const currentModeConfig = getCategoryModeSettings(currentCat);
      const currentMode = currentModeConfig.mode || 'sequence';

      if (currentMode === 'single') {
        stopWallpaperRotationTimer();
        return;
      }

      if (currentMode === 'shuffle') {
        const nextIdx = getNextShuffleIndex(currentCat, state.currentList, false);
        state.currentIndex = nextIdx;
        renderWallpaper(state.currentList[nextIdx]);
      } else {
        state.currentIndex = (state.currentIndex + 1) % state.currentList.length;
        const currentWp = state.currentList[state.currentIndex];
        updateCategoryProgress(currentCat, {
          sequenceIndex: state.currentIndex,
          lastWallpaperId: currentWp ? currentWp.id : null
        });
        renderWallpaper(currentWp);
      }
    }, ms);
  }

  function resetWallpaperRotationTimer() {
    startWallpaperRotationTimer();
  }

  function loadCategoryWallpaper(cat, isTabOpen = false) {
    state.activeCategory = cat;
    refreshCurrentList();

    const list = state.currentList;
    if (!list || list.length === 0) return;

    const modeConfig = getCategoryModeSettings(cat);
    const mode = modeConfig.mode || 'sequence';
    const progress = getCategoryProgress(cat);

    let targetIdx = 0;

    if (mode === 'single') {
      // SINGLE IMAGE MODE: Lock to selected image
      if (modeConfig.selectedWallpaperId) {
        const found = list.findIndex(w => w.id === modeConfig.selectedWallpaperId);
        if (found !== -1) {
          targetIdx = found;
        } else {
          targetIdx = 0;
          updateCategoryModeSettings(cat, 'single', list[0].id);
        }
      } else {
        targetIdx = 0;
        updateCategoryModeSettings(cat, 'single', list[0].id);
      }
    } else if (mode === 'shuffle') {
      // SHUFFLE MODE: Next random in cycle without consecutive repeats
      targetIdx = getNextShuffleIndex(cat, list, false);
    } else {
      // SEQUENCE MODE (Default): Follow sequential order anchored on lastWallpaperId
      if (progress.lastWallpaperId) {
        const lastIdx = list.findIndex(w => w.id === progress.lastWallpaperId);
        if (lastIdx !== -1) {
          targetIdx = isTabOpen ? ((lastIdx + 1) % list.length) : lastIdx;
        } else {
          targetIdx = (progress.sequenceIndex || 0) % list.length;
        }
      } else {
        targetIdx = 0;
      }

      updateCategoryProgress(cat, {
        sequenceIndex: targetIdx,
        lastWallpaperId: list[targetIdx] ? list[targetIdx].id : null
      });
    }

    state.currentIndex = targetIdx;
    renderWallpaper(list[targetIdx], !isTabOpen);
    resetWallpaperRotationTimer();
  }

  function nextWallpaper() {
    if (!state.currentList.length) return;
    const cat = state.activeCategory;
    const modeConfig = getCategoryModeSettings(cat);

    if (modeConfig.mode === 'shuffle') {
      const nextIdx = getNextShuffleIndex(cat, state.currentList, false);
      state.currentIndex = nextIdx;
      renderWallpaper(state.currentList[nextIdx]);
    } else {
      state.currentIndex = (state.currentIndex + 1) % state.currentList.length;
      updateCategoryProgress(cat, {
        sequenceIndex: state.currentIndex,
        lastWallpaperId: state.currentList[state.currentIndex].id
      });
      renderWallpaper(state.currentList[state.currentIndex]);
    }
    resetWallpaperRotationTimer();
  }

  function prevWallpaper() {
    if (!state.currentList.length) return;
    const cat = state.activeCategory;
    state.currentIndex = (state.currentIndex - 1 + state.currentList.length) % state.currentList.length;
    updateCategoryProgress(cat, {
      sequenceIndex: state.currentIndex,
      lastWallpaperId: state.currentList[state.currentIndex].id
    });
    renderWallpaper(state.currentList[state.currentIndex]);
    resetWallpaperRotationTimer();
  }

  function randomWallpaper() {
    if (!state.currentList.length) return;
    const cat = state.activeCategory;
    const nextIdx = getNextShuffleIndex(cat, state.currentList, false);
    state.currentIndex = nextIdx;
    renderWallpaper(state.currentList[nextIdx]);
    resetWallpaperRotationTimer();
    showToast('Loaded random wallpaper');
  }

  function setCategory(categoryName) {
    state.activeCategory = categoryName;
    loadCategoryWallpaper(categoryName, false);
    syncCategoryUI();
    window.storageManager.saveSettings({ activeCategory: categoryName });
    const modeConfig = getCategoryModeSettings(categoryName);
    showToast(`Category: ${categoryName} (${modeConfig.mode.toUpperCase()})`);
  }

  function updateHubQuickBar() {
    if (!DOM.hubCarTitle || !state.currentWallpaper) return;
    DOM.hubCarTitle.textContent = state.currentWallpaper.name || 'Automotive Masterpiece';
    DOM.hubCarSpecs.textContent = `${state.currentWallpaper.meta || ''} • ${state.currentWallpaper.category || state.activeCategory}`;
    updateFavoriteButtonState();
  }

  // ==========================================================
  // CATEGORY DISPLAY MODES ENGINE (SEQUENCE, SHUFFLE, SINGLE)
  // ==========================================================
  const ALL_DISPLAY_CATEGORIES = [
    'MIX',
    'Luxury Cars',
    'Sports Cars',
    'Classic Cars',
    'Off-Road & SUVs'
  ];

  const CATEGORY_ICONS = {
    'MIX': 'fa-solid fa-layer-group',
    'Luxury Cars': 'fa-solid fa-crown',
    'Sports Cars': 'fa-solid fa-bolt',
    'Classic Cars': 'fa-solid fa-clock-rotate-left',
    'Off-Road & SUVs': 'fa-solid fa-mountain'
  };

  function getCategoryModeSettings(cat) {
    if (!state.settings.categoryDisplayModes) {
      state.settings.categoryDisplayModes = {};
    }
    if (!state.settings.categoryDisplayModes[cat]) {
      state.settings.categoryDisplayModes[cat] = { mode: 'sequence', selectedWallpaperId: null };
    }
    return state.settings.categoryDisplayModes[cat];
  }

  function getCategoryProgress(cat) {
    if (!state.settings.categoryProgress) {
      state.settings.categoryProgress = {};
    }
    if (!state.settings.categoryProgress[cat]) {
      state.settings.categoryProgress[cat] = { sequenceIndex: 0, shuffleHistory: [], lastWallpaperId: null };
    }
    return state.settings.categoryProgress[cat];
  }

  async function updateCategoryModeSettings(cat, mode, selectedWallpaperId = null) {
    const config = getCategoryModeSettings(cat);
    config.mode = mode;
    if (selectedWallpaperId !== null) {
      config.selectedWallpaperId = selectedWallpaperId;
    }
    await window.storageManager.saveSettings({ categoryDisplayModes: state.settings.categoryDisplayModes });
  }

  async function updateCategoryProgress(cat, patch) {
    const prog = getCategoryProgress(cat);
    Object.assign(prog, patch);
    await window.storageManager.saveSettings({ categoryProgress: state.settings.categoryProgress });
  }

  function getNextShuffleIndex(cat, list, isNewCycle = false) {
    const progress = getCategoryProgress(cat);
    let history = progress.shuffleHistory || [];

    // Filter history to items currently in the list
    history = history.filter(id => list.some(w => w.id === id));

    // If all items shown in this shuffle cycle, start a new cycle
    if (history.length >= list.length) {
      history = [];
    }

    // Remaining unshown candidates
    const unshown = list.filter(w => !history.includes(w.id));
    let pool = unshown.length > 0 ? unshown : list;

    // Avoid showing the exact same wallpaper back-to-back if more than 1 item available
    if (pool.length > 1 && progress.lastWallpaperId) {
      const filtered = pool.filter(w => w.id !== progress.lastWallpaperId);
      if (filtered.length > 0) {
        pool = filtered;
      }
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)] || list[0];
    const targetIdx = list.findIndex(w => w.id === chosen.id);

    history.push(chosen.id);
    updateCategoryProgress(cat, {
      shuffleHistory: history,
      lastWallpaperId: chosen.id
    });

    return targetIdx !== -1 ? targetIdx : 0;
  }



  function syncCategoryUI() {
    const counts = window.wallpaperService ? window.wallpaperService.getCategoryCounts() : {};

    // Incorporate user uploads in counts
    if (state.userWallpapers && state.userWallpapers.length) {
      state.userWallpapers.forEach(w => {
        if (counts[w.category] !== undefined) counts[w.category]++;
        if (counts['MIX'] !== undefined) counts['MIX']++;
      });
    }

    document.querySelectorAll('.category-select-card').forEach(card => {
      const cat = card.getAttribute('data-cat');
      card.classList.toggle('active', cat === state.activeCategory);

      let badge = card.querySelector('.category-count-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'category-count-badge';
        badge.style.cssText = 'display:inline-block; margin-left:8px; font-size:10px; padding:2px 7px; border-radius:10px; background:rgba(255,255,255,0.12); color:rgba(255,255,255,0.7); font-weight:700; vertical-align:middle;';
        const titleEl = card.querySelector('div > div:first-child');
        if (titleEl) titleEl.appendChild(badge);
      }
      if (badge && counts[cat] !== undefined) {
        badge.textContent = counts[cat];
      }
    });
  }

  // ==========================================================
  // FAVORITES
  // ==========================================================
  async function toggleCurrentFavorite() {
    if (!state.currentWallpaper) return;
    const isNowFav = await window.storageManager.toggleFavorite(state.currentWallpaper);
    state.favorites = await window.storageManager.getFavorites();
    updateFavoriteButtonState();
    
    if (isNowFav) {
      showToast(`Added to Favorites: ${state.currentWallpaper.name}`);
    } else {
      showToast(`Removed from Favorites: ${state.currentWallpaper.name}`);
    }

    if (state.activeTab === 'favorites') {
      renderFavoritesView();
    }
  }

  async function updateFavoriteButtonState() {
    if (!state.currentWallpaper || !DOM.hubBtnFav) return;
    const isFav = await window.storageManager.isFavorite(state.currentWallpaper.id);
    DOM.hubBtnFav.classList.toggle('active-fav', isFav);
    DOM.hubBtnFav.innerHTML = isFav 
      ? '<i class="fa-solid fa-heart"></i> Favorited' 
      : '<i class="fa-regular fa-heart"></i> Favorite';
  }

  // ==========================================================
  // HUB MODAL & TABS MANAGEMENT
  // ==========================================================
  function openHub(tabName = 'categories') {
    switchHubTab(tabName);
    DOM.viewHubModal.classList.add('open');
  }

  function closeHub() {
    DOM.viewHubModal.classList.remove('open');
  }

  function switchHubTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll('.hub-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.hub-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-panel-${tabName}`);
    });

    if (tabName === 'explore') {
      renderExploreView();
    } else if (tabName === 'uploads') {
      renderMyWallpapersView();
    } else if (tabName === 'favorites') {
      renderFavoritesView();
    } else if (tabName === 'settings') {
      renderSettingsView();
    }
  }

  // ==========================================================
  // EXPLORE VIEW INSIDE HUB
  // ==========================================================
  function renderExploreView() {
    const grid = DOM.exploreGalleryGrid;
    grid.innerHTML = '';

    const all = getAllAvailableWallpapers();
    const query = (state.exploreSearchQuery || '').toLowerCase().trim();
    const filterCat = state.exploreFilterCat || 'MIX';

    const filtered = all.filter(item => {
      const matchesCat = filterCat === 'MIX' || item.category === filterCat;
      const matchesSearch = !query || 
        item.name.toLowerCase().includes(query) || 
        (item.meta && item.meta.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query));
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 36px; margin-bottom: 12px; opacity: 0.3;"></i>
          <h4>No wallpapers found</h4>
          <p style="font-size: 12px;">Try searching for a different car model or category.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = createWallpaperCard(item, {
        showApply: true,
        showDelete: true,
        onApply: () => {
          state.activeCategory = item.category;
          refreshCurrentList();
          const targetIdx = state.currentList.findIndex(w => w.id === item.id);
          state.currentIndex = targetIdx !== -1 ? targetIdx : 0;
          renderWallpaper(item);
          closeHub();
          showToast(`Applied: ${item.name}`);
        },
        onDelete: async () => {
          if (confirm(`Delete "${item.name}"? It will be permanently removed from all active categories, galleries, and display modes.`)) {
            await deleteActiveWallpaper(item.id);
            showToast(`Deleted: ${item.name}`);
            renderExploreView();
          }
        }
      });
      grid.appendChild(card);
    });
  }

  // ==========================================================
  // MY UPLOADS INSIDE HUB
  // ==========================================================
  async function renderMyWallpapersView() {
    state.userWallpapers = await window.wallpaperDB.getAllWallpapers();
    DOM.userWallpaperCount.textContent = state.userWallpapers.length;
    
    const usageInfo = await window.wallpaperDB.getStorageUsage();
    if (usageInfo.quota > 0) {
      const mbUsed = (usageInfo.usage / (1024 * 1024)).toFixed(1);
      DOM.dbStorageStat.textContent = `IndexedDB: ${mbUsed} MB used`;
    }

    const grid = DOM.userGalleryGrid;
    grid.innerHTML = '';

    if (state.userWallpapers.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <i class="fa-regular fa-image" style="font-size: 36px; margin-bottom: 12px; opacity: 0.3;"></i>
          <h4>No custom uploads yet</h4>
          <p style="font-size: 12px;">Drop personal car wallpapers above to save them offline in IndexedDB.</p>
        </div>
      `;
      return;
    }

    state.userWallpapers.forEach(item => {
      const card = createWallpaperCard(item, {
        showApply: true,
        showDelete: true,
        onApply: () => {
          state.activeCategory = item.category;
          refreshCurrentList();
          const targetIdx = state.currentList.findIndex(w => w.id === item.id);
          state.currentIndex = targetIdx !== -1 ? targetIdx : 0;
          renderWallpaper(item);
          closeHub();
          showToast(`Applied: ${item.name}`);
        },
        onDelete: async () => {
          if (confirm(`Delete "${item.name}" from your uploads?`)) {
            await deleteActiveWallpaper(item.id);
            showToast('Wallpaper deleted');
            renderMyWallpapersView();
          }
        }
      });
      grid.appendChild(card);
    });
  }

  async function handleFileUploads(files) {
    if (!files || !files.length) return;
    const category = DOM.uploadCategoryAssign.value || 'Luxury Cars';
    const customTitleBase = DOM.uploadCustomTitle.value.trim();

    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.match(/^image\/(jpeg|png|webp)$/i)) {
        showToast(`Skipped non-supported file: ${file.name}`);
        continue;
      }

      const title = customTitleBase 
        ? (files.length > 1 ? `${customTitleBase} (${i + 1})` : customTitleBase)
        : file.name.replace(/\.[^/.]+$/, "");

      const dataUrl = await readFileAsDataURL(file);

      const record = await window.wallpaperDB.addWallpaper({
        name: title,
        category,
        dataUrl,
        meta: `Custom Upload (${(file.size / 1024 / 1024).toFixed(2)} MB) • Offline IndexedDB`
      });

      if (window.imageOptimizer) {
        window.imageOptimizer.optimizeWallpaper(record).catch(() => {});
      }

      // Explicit user upload action registers it as a new active wallpaper
      if (state.deletedWallpaperIds && state.deletedWallpaperIds.has(record.id)) {
        await window.storageManager.unmarkWallpaperDeleted(record.id);
        state.deletedWallpaperIds.delete(record.id);
      }

      uploadedCount++;
    }

    if (uploadedCount > 0) {
      DOM.uploadCustomTitle.value = '';
      state.userWallpapers = await window.wallpaperDB.getAllWallpapers();
      refreshCurrentList();
      renderMyWallpapersView();
      showToast(`Uploaded ${uploadedCount} wallpaper(s)`);
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  // ==========================================================
  // FAVORITES INSIDE HUB
  // ==========================================================
  async function renderFavoritesView() {
    state.favorites = await window.storageManager.getFavorites();

    // Clean up any favorite whose wallpaper was deleted or whose image file no longer exists
    const available = getAllAvailableWallpapers();
    const availableIds = new Set(available.map(w => w.id));
    const validFavs = (state.favorites || []).filter(item => {
      const id = typeof item === 'string' ? item : item.id;
      return availableIds.has(id) && (!state.deletedWallpaperIds || !state.deletedWallpaperIds.has(id));
    });

    if (validFavs.length !== (state.favorites || []).length) {
      state.favorites = validFavs;
      await window.storageManager.saveFavorites(validFavs);
    }

    DOM.favCounterBadge.textContent = `${state.favorites.length} saved favorites`;

    const grid = DOM.favoritesGalleryGrid;
    grid.innerHTML = '';

    if (state.favorites.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <i class="fa-regular fa-heart" style="font-size: 36px; margin-bottom: 12px; opacity: 0.3;"></i>
          <h4>No favorite wallpapers saved</h4>
          <p style="font-size: 12px;">Press "F" while viewing any wallpaper to bookmark it.</p>
        </div>
      `;
      return;
    }

    state.favorites.forEach(item => {
      const card = createWallpaperCard(item, {
        showApply: true,
        showDelete: true,
        deleteLabel: '<i class="fa-solid fa-xmark"></i> Remove',
        onApply: () => {
          state.activeCategory = item.category || 'MIX';
          refreshCurrentList();
          renderWallpaper(item);
          closeHub();
          showToast(`Applied: ${item.name}`);
        },
        onDelete: async () => {
          await window.storageManager.toggleFavorite(item);
          renderFavoritesView();
          updateFavoriteButtonState();
          showToast(`Removed: ${item.name}`);
        }
      });
      grid.appendChild(card);
    });
  }

  // ==========================================================
  // SETTINGS INSIDE HUB
  // ==========================================================
  function renderSettingsView() {
    const s = state.settings;
    DOM.settingDefaultCat.value = s.defaultCategory || 'MIX';
    DOM.settingFitMode.value = s.fitMode || 'cover';
    DOM.settingTransitionStyle.value = s.transitionEffect || 'fade';
    DOM.settingDockSize.value = s.dockIconSize || 'medium';
    if (DOM.settingRotationInterval) {
      DOM.settingRotationInterval.value = s.rotationInterval || '30s';
    }

    DOM.toggleShowSearchBar.classList.toggle('active', s.showSearchBar !== false);
    DOM.toggleShowAppDock.classList.toggle('active', s.showAppDock !== false);
    DOM.toggleRandomTab.classList.toggle('active', !!s.randomOnNewTab);

    renderCategoryDisplayModesSettings();
  }

  function renderCategoryDisplayModesSettings() {
    const container = DOM.categoryDisplayModesCard;
    if (!container) return;

    container.innerHTML = '';

    ALL_DISPLAY_CATEGORIES.forEach(cat => {
      const modeConfig = getCategoryModeSettings(cat);
      const mode = modeConfig.mode || 'sequence';
      const icon = CATEGORY_ICONS[cat] || 'fa-solid fa-car';
      const wallpapers = getWallpapersByCategory(cat);

      const row = document.createElement('div');
      row.className = 'category-mode-row';
      row.setAttribute('data-category', cat);

      const descText = mode === 'sequence' 
        ? 'Sequence: Displays wallpapers one by one in order and loops back.' 
        : (mode === 'shuffle' 
          ? 'Shuffle: Displays wallpapers in random order without consecutive repeats.' 
          : 'Single Image: Locks to one selected wallpaper permanently.');

      row.innerHTML = `
        <div class="category-mode-header">
          <div>
            <div class="category-mode-title">
              <i class="${icon}"></i> ${cat}
            </div>
            <div class="category-mode-desc">${descText}</div>
          </div>
          <div class="mode-pill-selector">
            <button class="mode-pill-btn ${mode === 'sequence' ? 'active' : ''}" data-cat="${cat}" data-mode="sequence" title="Loop in sequence">
              <i class="fa-solid fa-arrow-down-1-9"></i> Sequence
            </button>
            <button class="mode-pill-btn ${mode === 'shuffle' ? 'active' : ''}" data-cat="${cat}" data-mode="shuffle" title="Random shuffle cycle">
              <i class="fa-solid fa-shuffle"></i> Shuffle
            </button>
            <button class="mode-pill-btn ${mode === 'single' ? 'active' : ''}" data-cat="${cat}" data-mode="single" title="Lock to one selected image">
              <i class="fa-solid fa-thumbtack"></i> Single Image
            </button>
          </div>
        </div>
        <div class="mode-single-picker" style="display: ${mode === 'single' ? 'block' : 'none'};">
          <div class="single-picker-label">
            <span>Select Wallpaper to Lock:</span>
            <span style="font-size:10px; opacity:0.7;">${wallpapers.length} Available</span>
          </div>
          <div class="single-thumbnails-grid">
            ${wallpapers.map(w => {
              const isSelected = modeConfig.selectedWallpaperId === w.id || (!modeConfig.selectedWallpaperId && wallpapers[0].id === w.id);
              const imgUrl = w.src || w.dataUrl || w.fallback;
              return `
                <div class="single-thumb-item ${isSelected ? 'active' : ''}" data-cat="${cat}" data-id="${w.id}">
                  <div class="single-thumb-img-wrap">
                    <img src="${imgUrl}" alt="${w.name}" loading="lazy">
                    <div class="single-thumb-check"><i class="fa-solid fa-check"></i></div>
                  </div>
                  <div class="single-thumb-name" title="${w.name}">${w.name}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      // Event listener for mode pills
      row.querySelectorAll('.mode-pill-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const targetMode = btn.getAttribute('data-mode');
          const targetCat = btn.getAttribute('data-cat');
          
          row.querySelectorAll('.mode-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const picker = row.querySelector('.mode-single-picker');
          if (picker) {
            picker.style.display = targetMode === 'single' ? 'block' : 'none';
          }

          // Update description
          const descEl = row.querySelector('.category-mode-desc');
          if (descEl) {
            descEl.textContent = targetMode === 'sequence' 
              ? 'Sequence: Displays wallpapers one by one in order and loops back.' 
              : (targetMode === 'shuffle' 
                ? 'Shuffle: Displays wallpapers in random order without consecutive repeats.' 
                : 'Single Image: Locks to one selected wallpaper permanently.');
          }

          // If switching to single mode and no image selected, default to first
          let selectedId = modeConfig.selectedWallpaperId;
          if (targetMode === 'single' && !selectedId && wallpapers.length > 0) {
            selectedId = wallpapers[0].id;
            const firstThumb = row.querySelector('.single-thumb-item');
            if (firstThumb) firstThumb.classList.add('active');
          }

          await updateCategoryModeSettings(targetCat, targetMode, selectedId);

          // If currently viewing that category, immediately apply
          if (state.activeCategory === targetCat) {
            loadCategoryWallpaper(targetCat, false);
          }

          showToast(`${targetCat}: ${targetMode.toUpperCase()} Mode saved`);
        });
      });

      // Event listener for thumbnail items
      row.querySelectorAll('.single-thumb-item').forEach(thumb => {
        thumb.addEventListener('click', async (e) => {
          e.stopPropagation();
          const targetId = thumb.getAttribute('data-id');
          const targetCat = thumb.getAttribute('data-cat');

          row.querySelectorAll('.single-thumb-item').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');

          await updateCategoryModeSettings(targetCat, 'single', targetId);

          // If current category, apply immediately
          if (state.activeCategory === targetCat) {
            const foundWp = wallpapers.find(w => w.id === targetId);
            if (foundWp) {
              const idx = state.currentList.findIndex(w => w.id === targetId);
              state.currentIndex = idx !== -1 ? idx : 0;
              renderWallpaper(foundWp);
            }
          }

          const wpObj = wallpapers.find(w => w.id === targetId);
          showToast(`Locked: ${wpObj ? wpObj.name : 'Wallpaper'}`);
        });
      });

      container.appendChild(row);
    });
  }

  // Wallpaper Card Component
  function createWallpaperCard(item, options = {}) {
    const card = document.createElement('div');
    card.className = 'wallpaper-card';

    const bgUrl = item.src || item.dataUrl || item.fallback;

    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${bgUrl}" alt="${item.name}" loading="lazy">
        <div class="card-tag">${item.category}</div>
        <button class="card-fav-btn" title="Toggle Favorite">
          <i class="fa-regular fa-heart"></i>
        </button>
      </div>
      <div class="card-body">
        <div class="card-title">${item.name}</div>
        <div class="card-meta">${item.meta || 'Cinematic automotive photography'}</div>
        <div class="card-actions-row">
          ${options.showApply ? '<button class="card-btn-apply"><i class="fa-solid fa-check"></i> Apply</button>' : ''}
          ${options.showDelete ? `<button class="card-btn-delete">${options.deleteLabel || '<i class="fa-regular fa-trash-can"></i> Delete'}</button>` : ''}
        </div>
      </div>
    `;

    const favBtn = card.querySelector('.card-fav-btn');
    window.storageManager.isFavorite(item.id).then(isFav => {
      favBtn.classList.toggle('favorited', isFav);
      favBtn.querySelector('i').className = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    });

    favBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isNowFav = await window.storageManager.toggleFavorite(item);
      favBtn.classList.toggle('favorited', isNowFav);
      favBtn.querySelector('i').className = isNowFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
      updateFavoriteButtonState();
      showToast(isNowFav ? 'Added to favorites' : 'Removed from favorites');
      if (state.activeTab === 'favorites') {
        renderFavoritesView();
      }
    });

    if (options.onApply) {
      const applyBtn = card.querySelector('.card-btn-apply');
      if (applyBtn) applyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        options.onApply();
      });
      card.addEventListener('click', () => options.onApply());
    }

    if (options.onDelete) {
      const deleteBtn = card.querySelector('.card-btn-delete');
      if (deleteBtn) deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        options.onDelete();
      });
    }

    return card;
  }

  // ==========================================================
  // TOAST NOTIFICATIONS
  // ==========================================================
  let toastTimer = null;
  function showToast(msg) {
    if (!DOM.toast || !DOM.toastMsg) return;
    DOM.toastMsg.textContent = msg;
    DOM.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 2200);
  }

  // ==========================================================
  // EVENT LISTENERS BINDING
  // ==========================================================
  function setupEventListeners() {
    // Open & Close Menu / Hub
    DOM.btnOpenMenu.addEventListener('click', () => openHub('categories'));
    DOM.btnCloseHub.addEventListener('click', closeHub);

    // Hub Tabs
    document.querySelectorAll('.hub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchHubTab(btn.getAttribute('data-tab'));
      });
    });

    // Category Selection Cards
    document.querySelectorAll('.category-select-card').forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.getAttribute('data-cat');
        setCategory(cat);
      });
    });

    // Hub Quick Wallpaper Controls
    DOM.hubBtnPrev.addEventListener('click', prevWallpaper);
    DOM.hubBtnNext.addEventListener('click', nextWallpaper);
    DOM.hubBtnRandom.addEventListener('click', randomWallpaper);
    DOM.hubBtnFav.addEventListener('click', toggleCurrentFavorite);

    // Explore filter & search
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active-filter'));
        btn.classList.add('active-filter');
        state.exploreFilterCat = btn.getAttribute('data-filter');
        renderExploreView();
      });
    });

    DOM.exploreSearchInput.addEventListener('input', (e) => {
      state.exploreSearchQuery = e.target.value;
      renderExploreView();
    });

    // Upload Dropzone & File Picker
    DOM.uploadDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.uploadDropzone.classList.add('dragover');
    });

    DOM.uploadDropzone.addEventListener('dragleave', () => {
      DOM.uploadDropzone.classList.remove('dragover');
    });

    DOM.uploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.uploadDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFileUploads(e.dataTransfer.files);
      }
    });

    DOM.filePickerInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        handleFileUploads(e.target.files);
      }
    });

    // Clear Favorites
    DOM.btnClearAllFavs.addEventListener('click', async () => {
      if (confirm('Clear all saved favorites?')) {
        await window.storageManager.clearFavorites();
        state.favorites = [];
        renderFavoritesView();
        updateFavoriteButtonState();
        showToast('Favorites cleared');
      }
    });

    // Settings Listeners
    DOM.toggleShowSearchBar.addEventListener('click', async () => {
      const active = DOM.toggleShowSearchBar.classList.toggle('active');
      await window.storageManager.saveSettings({ showSearchBar: active });
      state.settings.showSearchBar = active;
      DOM.searchBarContainer.style.display = active ? 'block' : 'none';
      showToast(`Search bar: ${active ? 'Shown' : 'Hidden'}`);
    });

    DOM.toggleShowAppDock.addEventListener('click', async () => {
      const active = DOM.toggleShowAppDock.classList.toggle('active');
      await window.storageManager.saveSettings({ showAppDock: active });
      state.settings.showAppDock = active;
      DOM.dockContainer.style.display = active ? 'block' : 'none';
      showToast(`App dock: ${active ? 'Shown' : 'Hidden'}`);
    });

    DOM.settingDockSize.addEventListener('change', async (e) => {
      const size = e.target.value;
      await window.storageManager.saveSettings({ dockIconSize: size });
      state.settings.dockIconSize = size;
      applyDockSizeSetting();
      showToast(`Dock size: ${size}`);
    });

    DOM.btnResetShortcuts.addEventListener('click', async () => {
      if (confirm('Reset app shortcuts to default?')) {
        state.shortcuts = await window.storageManager.resetShortcuts();
        renderAppDock();
        showToast('Default shortcuts restored');
      }
    });

    DOM.settingDefaultCat.addEventListener('change', async (e) => {
      await window.storageManager.saveSettings({ defaultCategory: e.target.value });
      state.settings.defaultCategory = e.target.value;
      showToast('Default category saved');
    });

    DOM.settingFitMode.addEventListener('change', async (e) => {
      const mode = e.target.value;
      await window.storageManager.saveSettings({ fitMode: mode });
      state.settings.fitMode = mode;
      DOM.layerA.style.backgroundSize = mode;
      DOM.layerB.style.backgroundSize = mode;
      showToast(`Fit mode: ${mode}`);
    });

    DOM.settingTransitionStyle.addEventListener('change', async (e) => {
      await window.storageManager.saveSettings({ transitionEffect: e.target.value });
      state.settings.transitionEffect = e.target.value;
      showToast(`Transition: ${e.target.value}`);
    });

    if (DOM.settingRotationInterval) {
      DOM.settingRotationInterval.addEventListener('change', async (e) => {
        const interval = e.target.value;
        await window.storageManager.saveSettings({ rotationInterval: interval });
        state.settings.rotationInterval = interval;
        startWallpaperRotationTimer();
        showToast(`Auto-rotate: ${interval === 'none' ? 'Disabled' : 'Every ' + interval}`);
      });
    }

    // Pause rotation timer when tab is hidden, resume when visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopWallpaperRotationTimer();
      } else {
        startWallpaperRotationTimer();
      }
    });

    window.addEventListener('beforeunload', () => {
      stopWallpaperRotationTimer();
    });

    DOM.toggleRandomTab.addEventListener('click', async () => {
      const active = DOM.toggleRandomTab.classList.toggle('active');
      await window.storageManager.saveSettings({ randomOnNewTab: active });
      state.settings.randomOnNewTab = active;
      showToast(`Random on tab: ${active ? 'Enabled' : 'Disabled'}`);
    });

    DOM.btnSettingsClearDB.addEventListener('click', async () => {
      if (confirm('Permanently delete all custom uploaded wallpapers from IndexedDB?')) {
        if (window.imageOptimizer) {
          await window.imageOptimizer.clearAllCache();
        }
        await window.wallpaperDB.clearAllCustomWallpapers();
        state.userWallpapers = [];
        refreshCurrentList();
        renderWallpaper(state.currentList[0]);
        showToast('All custom wallpapers purged');
      }
    });

    DOM.btnSettingsReset.addEventListener('click', async () => {
      if (confirm('Reset all settings to factory defaults?')) {
        state.settings = await window.storageManager.resetSettings();
        applyLoadedSettings();
        renderSettingsView();
        showToast('Settings reset to defaults');
      }
    });

    // Keyboard Shortcuts (Arrow Left/Right, Space, F, Esc, "/")
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // Focus search on "/"
      if (e.key === '/' && !isInputActive && !DOM.viewHubModal.classList.contains('open')) {
        e.preventDefault();
        DOM.searchInput.focus();
        DOM.searchInput.select();
        return;
      }

      if (isInputActive) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextWallpaper();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevWallpaper();
      } else if (e.key === ' ') {
        e.preventDefault();
        randomWallpaper();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleCurrentFavorite();
      } else if (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (DOM.viewHubModal.classList.contains('open')) {
          closeHub();
        } else {
          openHub('categories');
        }
      } else if (e.key === 'Escape') {
        if (DOM.viewShortcutModal.classList.contains('open')) {
          closeShortcutModal();
        } else if (DOM.viewHubModal.classList.contains('open')) {
          closeHub();
        }
      }
    });
  }

  function applyLoadedSettings() {
    const s = state.settings;
    if (s.fitMode) {
      DOM.layerA.style.backgroundSize = s.fitMode;
      DOM.layerB.style.backgroundSize = s.fitMode;
    }
    if (DOM.searchBarContainer) {
      DOM.searchBarContainer.style.display = s.showSearchBar === false ? 'none' : 'block';
    }
    if (DOM.dockContainer) {
      DOM.dockContainer.style.display = s.showAppDock === false ? 'none' : 'block';
    }
    applyDockSizeSetting();
  }

  // ==========================================================
  // INITIALIZATION ENGINE
  // ==========================================================
  async function init() {
    initDOMCache();

    state.settings = await window.storageManager.getSettings();
    state.favorites = await window.storageManager.getFavorites();

    const deletedIds = await window.storageManager.getDeletedWallpaperIds();
    state.deletedWallpaperIds = new Set(deletedIds || []);

    // Explicitly purge removed builtins (Mercedes 300SL, Dodge Charger, Maserati Quattroporte)
    for (const pId of ['builtin-classic-2', 'builtin-classic-3', 'builtin-lux-6']) {
      if (!state.deletedWallpaperIds.has(pId)) {
        await window.storageManager.markWallpaperDeleted(pId);
        state.deletedWallpaperIds.add(pId);
      }
      if (window.wallpaperDB) {
        try {
          await window.wallpaperDB.deleteOptimizedByWallpaperId(pId);
        } catch (e) {}
      }
    }

    // Auto cache-buster & migration on wallpaper library update
    const CURRENT_CACHE_VERSION = 'v2.4.0';
    if (state.settings.cacheVersion !== CURRENT_CACHE_VERSION) {
      if (window.wallpaperDB) {
        try {
          await window.wallpaperDB.clearOptimizedCache();
        } catch (e) {}
      }
      if (window.imageOptimizer && window.imageOptimizer.memoryCache) {
        window.imageOptimizer.memoryCache.clear();
      }
      state.settings.cacheVersion = CURRENT_CACHE_VERSION;
      await window.storageManager.saveSettings(state.settings);
    }

    // Unregister deleted IDs from active wallpaperService registry
    if (window.wallpaperService) {
      state.deletedWallpaperIds.forEach(id => {
        window.wallpaperService.removeWallpaper(id);
      });
    }

    // Sanitize favorites against deleted wallpapers
    state.favorites = (state.favorites || []).filter(f => {
      const id = typeof f === 'string' ? f : f.id;
      return !state.deletedWallpaperIds.has(id);
    });

    try {
      state.userWallpapers = await window.wallpaperDB.getAllWallpapers();
    } catch (e) {
      console.debug('IndexedDB initial load error:', e);
      state.userWallpapers = [];
    }

    state.activeCategory = state.settings.defaultCategory || 'MIX';
    refreshCurrentList();

    // Subscribe to dynamic central registry updates
    if (window.wallpaperService) {
      window.wallpaperService.subscribe((event, data) => {
        refreshCurrentList(true);
        syncCategoryUI();
        if (state.activeTab === 'explore') {
          renderExploreGallery();
        }
      });
    }

    applyLoadedSettings();
    setupSearchBar();
    setupShortcutModalListeners();
    await renderAppDock();

    loadCategoryWallpaper(state.activeCategory, true);

    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
