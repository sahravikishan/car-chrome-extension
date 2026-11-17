@echo off
title Apex Cinema — Real-Time Image Auto-Sync Monitor
cd /d "%~dp0"
python image_sync_manager.py --watch
pause
