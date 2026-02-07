@echo off
setlocal

echo [96m==================================================[0m
echo [97m   MongoDB Automatic Setup & Fix Tool           [0m
echo [96m==================================================[0m
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [92m[ok] Running as Administrator.[0m
) else (
    echo [91m[X] NOT running as Administrator.[0m
    echo Please right-click this file and select "Run as administrator".
    pause
    exit /b
)

:: Check if MongoDB is already installed (basic check)
if exist "C:\Program Files\MongoDB\Server" (
    echo [93m[!] MongoDB folder found. Attempting to start service...[0m
    net start MongoDB
    if %errorLevel% == 0 (
        echo [92m[ok] MongoDB Service Started Successfully![0m
    ) else (
        echo [93m[!] Service start failed (maybe already running or not installed as service).[0m
        echo Try manually running 'mongod' in a new terminal.
    )
    goto :finish
)

echo.
echo [93m[!] MongoDB not found in standard location.[0m
echo [93m[!] Attempting to install via Winget...[0m
echo.

winget install MongoDB.Server
if %errorLevel% == 0 (
    echo.
    echo [92m[ok] MongoDB Installed Successfully![0m
    echo [93m[!] Attempting to start default service...[0m
    net start MongoDB
) else (
    echo.
    echo [91m[X] Automated installation failed.[0m
    echo Please install manually from: https://www.mongodb.com/try/download/community
)

:finish
echo.
echo [96m==================================================[0m
echo [97m   Setup Complete. You may need to restart your PC. [0m
echo [96m==================================================[0m
pause
