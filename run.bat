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
if exist "Dockerfile" goto :build
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

:build
echo [INFO] Construyendo imagen Docker (5-10 minutos)...
docker build -t stv-cambios .
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la construccion de la imagen.
    pause
    exit /b
)
echo [OK] Imagen construida
echo.

:run
echo [INFO] Iniciando contenedor...
docker stop stv 2>nul
docker rm stv 2>nul
docker run -d -p 80:80 --name stv stv-cambios
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al iniciar el contenedor.
    pause
    exit /b
)
echo [OK] Contenedor iniciado
echo.

echo ============================================
echo   LISTO!
echo   Abriendo navegador en http://localhost
echo ============================================
echo.
timeout /t 3 /nobreak >nul
start http://localhost

:cleanup
echo.
echo  Presiona cualquier tecla para cerrar...
pause >nul
