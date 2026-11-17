# Cinematic New Tab — Wallpaper Management System

This document explains the permanent, reusable image management architecture for the **Cinematic Car Wallpaper Chrome Extension**.

---

## 1. Directory Structure

```text
car chrom extestion/
├── assets/
│   └── wallpapers/
│       ├── luxury/         # Luxury Cars (Maybach, Rolls-Royce, Bentley, Maserati...)
│       ├── sports/         # Sports Cars (Porsche 911, Ferrari, BMW M4...)
│       ├── classic/        # Classic Cars (1967 Shelby GT500, 300SL Gullwing, Charger...)
│       ├── offroad/        # Off-Road & SUVs (G-Wagon, Maybach GLS 600, Defender...)
│       └── mixup/          # Dynamic MIX collection (hard-linked with all 4 folders)
├── js/
│   ├── wallpaperService.js # Central Wallpaper Registry Service (WallpaperService)
│   ├── wallpapers.js       # Curated registry data entries
│   ├── db.js               # IndexedDB manager for user custom uploads
│   ├── storage.js          # Settings & shortcut persistence
│   └── app.js              # Minimal UI controller (Search bar + App Dock)
└── scripts/
    ├── image_sync_manager.py     # Content-aware sync & SHA-256 duplicate removal engine
    ├── run_image_sync_watcher.bat# Live real-time file monitor
    ├── safe_deduplicate.bat      # Safe deduplication & backup launcher
    ├── add_wallpaper.py          # CLI helper to copy, link, and register wallpapers
    └── quick_sync.bat            # One-click hard-link synchronizer
```

---

## 2. The 5 Exact Categories

Only the following **5 categories** are supported:
1. **`Luxury Cars`**
2. **`Sports Cars`**
3. **`Classic Cars`**
4. **`Off-Road & SUVs`**
5. **`MIX`** *(dynamically derived in real-time from all 4 categories above)*

> [!IMPORTANT]
> **Strict Exclusion Rule**: JDM Cars, Supercars, and Hypercars are strictly prohibited and will be rejected automatically by the validator.

---

## 3. How to Add a New Wallpaper

### Workflow in 2 Easy Steps:

#### Step 1: Copy the Image Asset
Save your image (`.jpg`, `.jpeg`, `.png`, or `.webp`) into the matching category subfolder:
- `assets/wallpapers/luxury/`
- `assets/wallpapers/sports/`
- `assets/wallpapers/classic/`
- `assets/wallpapers/offroad/`

#### Step 2: Register the Wallpaper

You can register your wallpaper using any of the 3 supported methods:

### Method A: In `js/wallpapers.js` (Recommended for Built-in Wallpapers)
Add your wallpaper object into `INITIAL_WALLPAPERS`:

```javascript
{
  id: 'luxury-phantom-01',
  name: 'Rolls-Royce Phantom VIII',
  category: 'Luxury Cars',
  src: 'assets/wallpapers/luxury/rolls_royce_phantom.jpg',
  mixSrc: 'assets/wallpapers/mixup/rolls_royce_phantom.jpg',
  meta: '6.75L Twin-Turbo V12 • 563 HP • Executive Extended Wheelbase',
  camera: 'LEICA SL2 // 50MM F/1.4',
  isBuiltin: true
}
```

### Method B: Programmatic JavaScript API
Call `addWallpaper()` anywhere in your code or Chrome Developer Tools console:

```javascript
addWallpaper({
  id: "luxury-car-001",
  name: "Mercedes-Maybach Haute Voiture",
  category: "Luxury Cars",
  src: "assets/wallpapers/luxury/maybach_haute_voiture.jpg",
  meta: "6.0L Biturbo V12 • 621 HP • Limited Edition",
  camera: "HASSELBLAD H6D // 35MM F/2.8"
});
```

### Method C: Command-Line Helper (`scripts/add_wallpaper.py`)
Run the CLI helper from your terminal:

```bash
python scripts/add_wallpaper.py --image "C:\path\to\my_car.jpg" --category "Sports Cars" --name "Porsche 911 GT3 RS" --meta "4.0L High-Rev Flat-6 • 518 HP"
```
This automatically copies the image into `assets/wallpapers/sports/`, creates an NTFS hard-link in `assets/wallpapers/mixup/`, and registers it in `js/wallpapers.js`.

---

## 4. How to Add Multiple Wallpapers (Batch Registration)

Use `addWallpapersBatch()` with an array of wallpaper objects:

```javascript
addWallpapersBatch([
  {
    id: 'sport-aston-vantage',
    name: 'Aston Martin Vantage',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/aston_martin_vantage.jpg',
    meta: '4.0L Twin-Turbo V8 • 656 HP'
  },
  {
    id: 'offroad-bronco-raptor',
    name: 'Ford Bronco Raptor',
    category: 'Off-Road & SUVs',
    src: 'assets/wallpapers/offroad/bronco_raptor.jpg',
    meta: '3.0L EcoBoost Twin-Turbo V6 • 418 HP'
  }
]);
```

---

## 5. How the `MIX` Category Works Automatically

- You **never** need to manually maintain a separate list or copy for `MIX`.
- When querying `wallpaperService.getWallpapersByCategory('MIX')`, the service dynamically concatenates and returns all wallpapers across all 4 individual categories.
- When an image is added to any category, `MIX` immediately reflects the new addition in:
  - Wallpaper navigation (Next, Previous, Random)
  - Wallpaper counter badges
  - Hub explore gallery
  - Favorites system

---

## 6. How to Safely Remove a Wallpaper

### In JavaScript:
```javascript
window.wallpaperService.removeWallpaper('luxury-car-001');
```
This removes the wallpaper from active rotation, updates category counts, and refreshes the UI without reloading.

### Permanently:
1. Delete or comment out the entry in `js/wallpapers.js`.
2. Delete the file from `assets/wallpapers/<category>/` and `assets/wallpapers/mixup/`.

---

## 7. Supported Formats & Automatic Validation

| Check | Behavior |
| :--- | :--- |
| **Supported File Formats** | `.jpg`, `.jpeg`, `.png`, `.webp`, `.jfif` |
| **Category Validation** | Must match one of 4 strict categories (case-insensitive with auto-normalization) |
| **Forbidden Categories** | Any attempt to register JDM, Supercars, or Hypercars throws a clear rejection error |
| **Duplicate IDs** | Rejects registration if an ID is already in the registry (unless `overwrite: true`) |
| **Missing/Broken Images** | Graceful fallback probe prevents broken screens; attempts mirror/fallback URL |
| **Dynamic Event Emitter** | All UI components listen to `wallpaperService.subscribe()` to update live |

---

## 8. Automatic Synchronization & SHA-256 Duplicate Removal

The project includes an automatic image synchronization and duplicate removal engine:

### Commands:
```bash
# 1. Preview dry-run report (no files modified)
python scripts/image_sync_manager.py --dry-run

# 2. Synchronize all matching copies across folders
python scripts/image_sync_manager.py --sync

# 3. Safely remove redundant exact duplicates (creates backup first)
python scripts/image_sync_manager.py --cleanup-duplicates

# 4. Run real-time monitoring watcher (with loop prevention)
python scripts/image_sync_manager.py --watch
```

### Safety Features:
- **SHA-256 Content Hashing**: Compares actual cryptographic file contents, not just filenames.
- **Reference Guard**: Never deletes a file if it is actively referenced in `js/wallpapers.js` or project code.
- **Automated Pre-Cleanup Backups**: Stored in `backups/wallpapers_<timestamp>/`.
- **Infinite Loop Prevention**: Uses SHA-256 state tracking and sync locks to prevent circular event triggers.
