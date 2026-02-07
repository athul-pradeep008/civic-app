@echo off
echo [93m[!] Checking Docker Status...[0m
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [91m[X] Docker Desktop is NOT running![0m
    echo Please open Docker Desktop and wait for the whale icon to stop animating.
    echo Then run this script again.
    pause
    exit /b 1
)

echo [92m[ok] Docker is running.[0m
echo [93m[!] Starting MongoDB container...[0m
docker-compose up -d mongodb

echo.
echo [92m[ok] MongoDB should now be running on port 27017.[0m
echo You can now run 'npm run dev' in another terminal.
echo.
pause
