@echo off
title Apex Cinema — Safe Deduplication & Sync
cd /d "%~dp0"
echo ========================================================
echo Running Dry-Run Analysis...
echo ========================================================
python image_sync_manager.py --dry-run
echo.
set /p CONFIRM=Do you want to proceed with Backup, Sync, and Safe Cleanup? (y/n): 
if /i "%CONFIRM%"=="y" (
    echo.
    python image_sync_manager.py --sync
    python image_sync_manager.py --cleanup-duplicates
    echo.
    echo All operations completed safely!
) else (
    echo Operation cancelled by user.
)
pause
