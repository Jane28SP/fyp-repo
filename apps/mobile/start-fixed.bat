@echo off
echo ========================================
echo Starting Expo Mobile App
echo ========================================
echo.
echo Using local Expo CLI (not global expo-cli)
echo.
cd /d %~dp0
set EXPO_NO_VERSION_CHECK=1
npx --yes expo@latest start --offline
pause

