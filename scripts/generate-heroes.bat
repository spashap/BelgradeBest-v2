@echo off
REM Generate all 10 where-to-stay hero images, one by one.
REM Double-click this file, or run it from a terminal. Add --force to overwrite.
chcp 65001 >nul
echo Generating where-to-stay hero images...
node "%~dp0gen-all-heroes.mjs" %*
echo.
pause
