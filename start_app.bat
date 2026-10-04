@echo off
title Dutching Pro - Avvio Server
echo ========================================================
echo Avvio Dutching Pro (Backend FastAPI + Frontend React)
echo ========================================================

start "Dutching Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "Dutching Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo I server sono stati avviati!
echo Frontend: http://localhost:5173
echo Backend API: http://127.0.0.1:8000
echo ========================================================
