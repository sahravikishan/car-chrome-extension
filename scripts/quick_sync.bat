@echo off
title Apex Cinema Instant Sync
cd /d "%~dp0"
python sync_wallpapers.py --once
pause
