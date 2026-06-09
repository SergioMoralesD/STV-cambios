@echo off
title STV Portal B2B - Instalador
cls

echo ============================================
echo   STV Portal B2B - Instalador automatico
echo ============================================
echo   Solo necesitas tener DOCKER instalado
echo ============================================
echo.

:checkDocker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker no esta instalado.
    echo Descargalo: https://www.docker.com/products/docker-desktop/
    echo Instalalo, ejecutalo y volve a ejecutar este archivo.
    echo.
    pause
    exit /b
)
echo [OK] Docker detectado
echo.

:downloadProject
if exist "docker-compose.yml" goto :start
echo [INFO] Descargando proyecto desde GitHub...
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/samu-gonz/STV-cambios/archive/refs/heads/main.zip' -OutFile 'stv-proyecto.zip' -UseBasicParsing}"
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo descargar el proyecto.
    echo Revisa tu conexion a internet.
    pause
    exit /b
)
powershell -Command "& {Expand-Archive -Path 'stv-proyecto.zip' -DestinationPath '.' -Force}"
if exist "STV-cambios-main" cd STV-cambios-main
echo [OK] Proyecto descargado
echo.

:start
echo [INFO] Construyendo e iniciando contenedores (docker compose)...
docker compose up --build -d
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al construir o iniciar los contenedores.
    pause
    exit /b
)
echo [OK] Contenedores iniciados
echo.

echo ============================================
echo   LISTO!
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost
echo ============================================
echo.
timeout /t 3 /nobreak >nul
start http://localhost

:cleanup
echo.
echo  Presiona cualquier tecla para cerrar...
pause >nul
