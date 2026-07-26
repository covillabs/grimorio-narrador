@echo off
title Grimorio do Narrador — Vampiro: A Mascara V5
cd /d "%~dp0"
echo ===================================================
echo   Iniciando o Grimorio do Narrador...
echo ===================================================
echo.

:: Abre o navegador padrao no endereco do site em 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8080"

:: Executa o servidor web do Vite
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O servidor do Grimorio parou inesperadamente.
    pause
)
