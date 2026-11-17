"""
Apex Cinema - Wallpaper Instant Folder Sync & Watcher
Automatically keeps 'mixup' and category folders (luxury, sports, offroad, classic)
in 100% real-time NTFS hard-link synchronization.
"""

import os
import sys
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WP_DIR = os.path.join(BASE_DIR, "assets", "wallpapers")
MIXUP_DIR = os.path.join(WP_DIR, "mixup")
CATEGORIES = ["luxury", "sports", "offroad", "classic"]

def sync_folders():
    """Scans and ensures every file across categories is instantly hard-linked with mixup."""
    updated = 0
    os.makedirs(MIXUP_DIR, exist_ok=True)
    
    for cat in CATEGORIES:
        cat_dir = os.path.join(WP_DIR, cat)
        if not os.path.exists(cat_dir):
            continue
            
        for fname in os.listdir(cat_dir):
            cat_file = os.path.join(cat_dir, fname)
            if not os.path.isfile(cat_file):
                continue
            mix_file = os.path.join(MIXUP_DIR, fname)
            
            # Check if linked or need linking
            need_link = False
            if not os.path.exists(mix_file):
                need_link = True
            else:
                s_cat = os.stat(cat_file)
                s_mix = os.stat(mix_file)
                # If different inodes (e.g. editor broke link via atomic replace) or different mtime
                if s_cat.st_ino != s_mix.st_ino or s_cat.st_mtime != s_mix.st_mtime:
                    try:
                        os.remove(mix_file)
                        need_link = True
                    except Exception:
                        pass
                        
            if need_link:
                try:
                    os.link(cat_file, mix_file)
                    print(f" [SYNC] Linked [{cat}] {fname} <===> [mixup] {fname}")
                    updated += 1
                except Exception as e:
                    print(f" [ERROR] Could not link {fname}: {e}")
                    
    return updated

def watch_folders(interval=1.0):
    print("=====================================================")
    print(" Apex Cinema - Realtime Wallpaper Folder Watcher")
    print("=====================================================")
    print(f" Watching: {WP_DIR}")
    print(" Any edit, addition or change is synchronized instantly via NTFS hard-links.")
    print(" Press Ctrl+C to stop.\n")
    
    sync_folders()
    
    try:
        while True:
            time.sleep(interval)
            sync_folders()
    except KeyboardInterrupt:
        print("\nStopped watching.")

if __name__ == "__main__":
    if "--once" in sys.argv:
        print("Running one-time synchronization...")
        count = sync_folders()
        print(f"Completed! {count} links updated.")
    else:
        watch_folders()
