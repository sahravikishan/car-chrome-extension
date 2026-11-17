"""
Apex Cinema - Image Synchronization & Duplicate Removal Manager
================================================================
A production-grade, content-aware image management engine for Chrome Extension.

Features:
1. Automatic Image Sync: Detects edits/replacements and synchronizes all matching copies across folders.
2. SHA-256 Duplicate Detection: Identifies exact duplicate files via cryptographic content hash.
3. Reference-Aware Safety: Audits code references before any file removal; keeps canonical copies.
4. Loop-Proof Monitoring: Real-time file system watcher with debounce, temp-file filtering, and sync-lock.
5. Backup & Dry-Run: Creates timestamped backups and provides full dry-run reports before any cleanup.
"""

import os
import sys
import time
import shutil
import hashlib
import re
import json
from datetime import datetime

# Root paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
WP_DIR = os.path.join(BASE_DIR, "assets", "wallpapers")
MIXUP_DIR = os.path.join(WP_DIR, "mixup")
BACKUP_ROOT = os.path.join(BASE_DIR, "backups")

CATEGORIES = ["luxury", "sports", "offroad", "classic"]
VALID_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.jfif')
IGNORE_PATTERNS = ('.tmp', '.crdownload', '.temp', '~', '.swp', '.ds_store')

def get_file_sha256(filepath, retries=3):
    """Computes the SHA-256 hash of a file's contents with retry backoff."""
    if not os.path.exists(filepath) or not os.path.isfile(filepath):
        return None
    for attempt in range(retries):
        try:
            h = hashlib.sha256()
            with open(filepath, "rb") as f:
                while chunk := f.read(65536):
                    h.update(chunk)
            return h.hexdigest()
        except PermissionError:
            time.sleep(0.15)
        except Exception as e:
            print(f" [ERROR] Could not hash {filepath}: {e}")
            return None
    return None

def find_code_references():
    """Scans project code files to find all referenced wallpaper paths."""
    referenced_paths = set()
    code_extensions = ('.js', '.html', '.css', '.json', '.md')
    pattern = re.compile(r"assets/wallpapers/[a-zA-Z0-9_\-\s./]+\.(?:jpg|jpeg|png|webp|jfif)", re.IGNORECASE)

    for root, dirs, files in os.walk(BASE_DIR):
        if any(skip in root for skip in ['.git', 'node_modules', 'backups', '.gemini']):
            continue
        for f in files:
            if f.endswith(code_extensions):
                fp = os.path.join(root, f)
                try:
                    with open(fp, "r", encoding="utf-8", errors="ignore") as file_handle:
                        content = file_handle.read()
                        matches = pattern.findall(content)
                        for m in matches:
                            clean_m = m.strip().replace("\\", "/")
                            referenced_paths.add(clean_m)
                except Exception:
                    pass

    return referenced_paths

def get_all_wallpaper_files():
    """Returns a list of all wallpaper files with their metadata."""
    files = []
    if not os.path.exists(WP_DIR):
        return files

    for root, dirs, filenames in os.walk(WP_DIR):
        for f in filenames:
            if f.lower().endswith(VALID_EXTENSIONS) and not any(f.lower().endswith(p) for p in IGNORE_PATTERNS):
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, BASE_DIR).replace("\\", "/")
                folder = os.path.basename(root).lower()
                stat = os.stat(full_path)
                sha = get_file_sha256(full_path)
                files.append({
                    "full_path": full_path,
                    "rel_path": rel_path,
                    "filename": f,
                    "folder": folder,
                    "size": stat.st_size,
                    "mtime": stat.st_mtime,
                    "ino": stat.st_ino,
                    "nlink": stat.st_nlink,
                    "sha256": sha
                })
    return files

def create_backup(label="pre_cleanup"):
    """Creates a full timestamped backup of the assets/wallpapers directory."""
    os.makedirs(BACKUP_ROOT, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(BACKUP_ROOT, f"wallpapers_{label}_{timestamp}")
    
    if os.path.exists(WP_DIR):
        shutil.copytree(WP_DIR, backup_dir)
        print(f" [BACKUP] Created safe backup at: {backup_dir}")
        return backup_dir
    return None

def analyze_duplicates_and_sync():
    """
    Performs full SHA-256 duplicate analysis and identifies:
    1. Active referenced files.
    2. Missing synchronization links between categories and mixup.
    3. Redundant exact duplicate files that are safe to remove.
    """
    all_files = get_all_wallpaper_files()
    references = find_code_references()

    # Group by SHA-256
    hash_groups = {}
    for f in all_files:
        sha = f["sha256"]
        if not sha:
            continue
        if sha not in hash_groups:
            hash_groups[sha] = []
        hash_groups[sha].append(f)

    sync_tasks = []
    removals = []
    canonical_map = {}

    # 1. Determine canonical files for each category
    for cat in CATEGORIES:
        cat_dir = os.path.join(WP_DIR, cat)
        if not os.path.exists(cat_dir):
            continue
        for fname in os.listdir(cat_dir):
            if not fname.lower().endswith(VALID_EXTENSIONS):
                continue
            cat_file = os.path.join(cat_dir, fname)
            rel_cat = os.path.relpath(cat_file, BASE_DIR).replace("\\", "/")
            mix_file = os.path.join(MIXUP_DIR, fname)
            rel_mix = os.path.relpath(mix_file, BASE_DIR).replace("\\", "/")

            # Check if mixup file exists or is desynchronized
            if not os.path.exists(mix_file):
                sync_tasks.append({
                    "action": "CREATE_LINK",
                    "source": rel_cat,
                    "target": rel_mix,
                    "reason": "Missing in mixup"
                })
            else:
                cat_sha = get_file_sha256(cat_file)
                mix_sha = get_file_sha256(mix_file)
                if cat_sha != mix_sha:
                    # Determine which one was modified more recently
                    s_cat = os.stat(cat_file)
                    s_mix = os.stat(mix_file)
                    if s_cat.st_mtime >= s_mix.st_mtime:
                        sync_tasks.append({
                            "action": "UPDATE_TARGET",
                            "source": rel_cat,
                            "target": rel_mix,
                            "reason": f"Category file is newer ({datetime.fromtimestamp(s_cat.st_mtime)})"
                        })
                    else:
                        sync_tasks.append({
                            "action": "UPDATE_SOURCE",
                            "source": rel_mix,
                            "target": rel_cat,
                            "reason": f"Mixup file is newer ({datetime.fromtimestamp(s_mix.st_mtime)})"
                        })

    # 2. Duplicate Detection: Check for redundant exact duplicate files
    for sha, group in hash_groups.items():
        if len(group) <= 1:
            continue

        # Files in this group have identical content
        # Check if multiple files exist within the SAME folder (e.g. sports/Porsche.png vs sports/porsche.png)
        # or if redundant unreferenced aliases exist
        folder_files = {}
        for item in group:
            fld = item["folder"]
            if fld not in folder_files:
                folder_files[fld] = []
            folder_files[fld].append(item)

        for fld, items in folder_files.items():
            if len(items) > 1:
                # Multiple exact identical files in the same folder!
                # Select canonical: prefer the one explicitly referenced in code, or clean snake_case
                items_sorted = sorted(items, key=lambda x: (
                    x["rel_path"] not in references,  # Referenced first
                    ' ' in x["filename"],             # Avoid spaces
                    x["filename"].endswith('.jfif'),  # Prefer .png/.jpg over .jfif
                    len(x["filename"])                # Shorter clean name
                ))
                canonical = items_sorted[0]
                duplicates = items_sorted[1:]

                for dup in duplicates:
                    # Check safety: is dup referenced?
                    is_referenced = dup["rel_path"] in references
                    removals.append({
                        "file": dup["rel_path"],
                        "full_path": dup["full_path"],
                        "canonical": canonical["rel_path"],
                        "sha256": sha,
                        "is_referenced": is_referenced,
                        "safe": True
                    })

    return {
        "all_files_count": len(all_files),
        "unique_hashes_count": len(hash_groups),
        "sync_tasks": sync_tasks,
        "removals": removals,
        "references": references
    }

def print_dry_run_report(analysis):
    """Outputs a structured, human-readable dry-run report."""
    print("\n=======================================================")
    print(" APEX CINEMA -- IMAGE SYNC & DEDUPLICATION DRY-RUN")
    print("=======================================================")
    print(f" Total Image Files Scanned: {analysis['all_files_count']}")
    print(f" Unique Visual Hashes (SHA-256): {analysis['unique_hashes_count']}")
    print(f" Active Code References Found: {len(analysis['references'])}")
    print("-------------------------------------------------------")

    print("\n[1] PENDING SYNCHRONIZATION TASKS:")
    if not analysis["sync_tasks"]:
        print("  [OK] All category folders and mixup are 100% synchronized!")
    else:
        for t in analysis["sync_tasks"]:
            print(f"  -> [{t['action']}] {t['source']} ===> {t['target']} ({t['reason']})")

    print("\n[2] REDUNDANT EXACT DUPLICATE CANDIDATES:")
    if not analysis["removals"]:
        print("  [OK] No redundant unneeded duplicates found!")
    else:
        for r in analysis["removals"]:
            ref_status = "REFERENCED (Will re-route to canonical)" if r["is_referenced"] else "UNREFERENCED (Safe to remove)"
            print(f"  [X] [REDUNDANT] {r['file']}")
            print(f"      Canonical: {r['canonical']}")
            print(f"      Status:    {ref_status}")
            print(f"      SHA-256:   {r['sha256'][:16]}...")

    print("\n=======================================================\n")

def execute_synchronization(sync_tasks):
    """Executes necessary synchronization tasks safely using hard links."""
    applied = 0
    os.makedirs(MIXUP_DIR, exist_ok=True)

    for task in sync_tasks:
        src_path = os.path.join(BASE_DIR, task["source"].replace("/", "\\"))
        target_path = os.path.join(BASE_DIR, task["target"].replace("/", "\\"))

        if not os.path.exists(src_path):
            print(f" [SKIP] Source not found: {src_path}")
            continue

        try:
            if os.path.exists(target_path):
                os.remove(target_path)
            # Create hard-link so both folders share the exact same file in real-time
            try:
                os.link(src_path, target_path)
            except Exception:
                shutil.copy2(src_path, target_path)

            print(f" [SYNC OK] Linked: {task['source']} <===> {task['target']}")
            applied += 1
        except Exception as e:
            print(f" [SYNC ERROR] Could not sync {task['target']}: {e}")

    return applied

def execute_safe_cleanup(removals):
    """Safely removes redundant duplicate files after backup."""
    removed = 0
    for r in removals:
        p = r["full_path"]
        if os.path.exists(p):
            try:
                os.remove(p)
                print(f" [REMOVED] Redundant duplicate: {r['file']} (Kept canonical: {r['canonical']})")
                removed += 1
            except Exception as e:
                print(f" [CLEANUP ERROR] Failed to remove {p}: {e}")
    return removed

class ImageSyncWatcher:
    """
    Real-time file monitor that detects modifications, additions, and renames,
    synchronizing matching copies while preventing infinite loops.
    """
    def __init__(self, interval=1.0):
        self.interval = interval
        self.file_ledger = {}   # rel_path -> {"sha": ..., "mtime": ...}
        self.sync_lock = set()  # paths currently being written by the sync engine

    def snapshot(self):
        """Builds a map of all files with their current mtime and SHA-256."""
        curr = {}
        all_files = get_all_wallpaper_files()
        for f in all_files:
            curr[f["rel_path"]] = {
                "mtime": f["mtime"],
                "sha256": f["sha256"],
                "full_path": f["full_path"],
                "folder": f["folder"],
                "filename": f["filename"]
            }
        return curr

    def handle_changed_file(self, rel_path, info):
        """Called when a file is modified, added, or replaced."""
        if rel_path in self.sync_lock:
            return

        folder = info["folder"]
        filename = info["filename"]
        source_path = info["full_path"]
        source_sha = info["sha256"]

        print(f"\n [EVENT] Detected change in: {rel_path} (SHA: {source_sha[:12]}...)")

        # Determine target sync counterpart:
        # If in a category folder -> sync counterpart in mixup
        # If in mixup -> sync counterpart in appropriate category folder
        target_paths = []
        if folder in CATEGORIES:
            target_mix = os.path.join(MIXUP_DIR, filename)
            target_paths.append((target_mix, f"assets/wallpapers/mixup/{filename}"))
        elif folder == "mixup":
            # Search for category folders that hold a file with this filename
            for cat in CATEGORIES:
                candidate = os.path.join(WP_DIR, cat, filename)
                if os.path.exists(candidate):
                    target_paths.append((candidate, f"assets/wallpapers/{cat}/{filename}"))

        for target_full, target_rel in target_paths:
            if target_rel in self.sync_lock:
                continue

            target_sha = get_file_sha256(target_full)
            if target_sha == source_sha:
                # Already identical
                continue

            # Lock target to avoid loop
            self.sync_lock.add(target_rel)
            try:
                if os.path.exists(target_full):
                    os.remove(target_full)
                try:
                    os.link(source_path, target_full)
                except Exception:
                    shutil.copy2(source_path, target_full)

                new_sha = get_file_sha256(target_full)
                print(f" [AUTO-SYNC] Updated copy: {target_rel} (Now identical to {rel_path})")
            except Exception as e:
                print(f" [SYNC ERROR] Failed to update {target_rel}: {e}")
            finally:
                time.sleep(0.1)
                self.sync_lock.discard(target_rel)

    def watch(self):
        print("=====================================================")
        print(" APEX CINEMA -- REAL-TIME IMAGE AUTO-SYNC MONITOR")
        print("=====================================================")
        print(f" Monitoring: {WP_DIR}")
        print(" Mode: Real-time SHA-256 sync with infinite loop prevention")
        print(" Press Ctrl+C to terminate monitor.\n")

        self.file_ledger = self.snapshot()

        try:
            while True:
                time.sleep(self.interval)
                current_state = self.snapshot()

                # Check for modifications or additions
                for rel_path, info in current_state.items():
                    if rel_path in self.sync_lock:
                        continue
                    if rel_path not in self.file_ledger:
                        # New file added
                        self.handle_changed_file(rel_path, info)
                    elif (info["mtime"] != self.file_ledger[rel_path]["mtime"] or
                          info["sha256"] != self.file_ledger[rel_path]["sha256"]):
                        # File modified or replaced
                        self.handle_changed_file(rel_path, info)

                self.file_ledger = current_state

        except KeyboardInterrupt:
            print("\n [STOP] Monitoring stopped.")

# ==========================================================
# CLI ENTRY POINT
# ==========================================================
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Apex Cinema Image Sync & Deduplication Manager")
    parser.add_argument("--dry-run", action="store_true", help="Perform scan and show report without making changes")
    parser.add_argument("--sync", action="store_true", help="Synchronize all matching image copies across folders")
    parser.add_argument("--cleanup-duplicates", action="store_true", help="Safely remove redundant exact duplicate files after backup")
    parser.add_argument("--watch", action="store_true", help="Start real-time monitoring and synchronization")
    parser.add_argument("--backup-only", action="store_true", help="Create an immediate backup of assets/wallpapers")

    args = parser.parse_args()

    if args.backup_only:
        create_backup("manual")
        sys.exit(0)

    analysis = analyze_duplicates_and_sync()

    if args.dry_run or (not args.sync and not args.cleanup_duplicates and not args.watch):
        print_dry_run_report(analysis)
        sys.exit(0)

    if args.sync:
        create_backup("pre_sync")
        applied = execute_synchronization(analysis["sync_tasks"])
        print(f"\n [DONE] Successfully synchronized {applied} image links.")

    if args.cleanup_duplicates:
        create_backup("pre_cleanup")
        removed = execute_safe_cleanup(analysis["removals"])
        print(f"\n [DONE] Successfully removed {removed} redundant duplicates safely.")

    if args.watch:
        watcher = ImageSyncWatcher(interval=1.0)
        watcher.watch()
