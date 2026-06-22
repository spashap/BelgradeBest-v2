@echo off
REM Commit and push everything to git.
REM   Double-click to push with an auto message, or run with your own:
REM   push-to-git.bat Reworked homepage and where-to-stay leg
setlocal enabledelayedexpansion
cd /d "%~dp0.."

REM Remove a stale git index lock if one was left behind (safe on a single-user
REM machine where no other git process is running).
if exist ".git\index.lock" (
  echo Removing stale .git\index.lock ...
  del /f /q ".git\index.lock"
)

REM .env, node_modules, dist, heroes-src are excluded via .gitignore.

REM Make sure an 'origin' remote exists.
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERROR: no 'origin' remote is configured.
  echo Add it once, then re-run this file:
  echo    git remote add origin https://github.com/spashap/BelgradeBest-v2.git
  echo.
  pause
  exit /b 1
)

REM Ensure a git identity exists (commit fails silently without one).
git config user.email >nul 2>&1 || git config user.email "spashap@gmail.com"
git config user.name  >nul 2>&1 || git config user.name  "Pavel"

REM Commit message: (1) whatever you type after the filename, else (2) the first
REM line of scripts\commit-message.txt, else (3) a timestamp.
set "MSG=%*"
if "%MSG%"=="" if exist "%~dp0commit-message.txt" set /p MSG=<"%~dp0commit-message.txt"
if "%MSG%"=="" set "MSG=Update BelgradeBest site (%date% %time%)"

echo Staging all changes...
git add -A

REM Commit only if something is staged.
git diff --cached --quiet
if errorlevel 1 (
  echo Committing: !MSG!
  git commit -m "!MSG!" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
) else (
  echo No changes to commit - pushing any unpushed commits anyway.
)

REM Pull any remote commits FIRST (the question-radar job commits its feed to
REM GitHub, so origin can be ahead of this machine). -X theirs auto-resolves the
REM auto-generated radar feed in favour of the remote copy, so this never stops
REM to ask. Done after the local commit so the working tree is clean.
echo.
echo Syncing with origin first (the radar may have committed updates)...
git pull --no-rebase --no-edit -X theirs origin main
if errorlevel 1 (
  echo.
  echo SYNC FAILED - a conflict git could not auto-resolve. Run 'git status'.
  pause
  exit /b 1
)

echo.
echo Pushing to origin...
git push -u origin HEAD
if errorlevel 1 (
  echo.
  echo PUSH FAILED. Common fixes: check your internet/login, or run 'git status'.
) else (
  echo.
  echo Done - pushed to origin. Vercel will rebuild automatically.
)

echo.
pause
endlocal
