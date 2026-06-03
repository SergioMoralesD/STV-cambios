@echo off
title Instalando STV Cambios...
cls

echo ============================================
echo   STV Portal B2B - Instalacion automatica
echo ============================================
echo.

:checkDocker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop no esta instalado o no esta ejecutandose.
    echo.
    echo Descargalo de: https://www.docker.com/products/docker-desktop/
    echo Instalalo, ejecutalo, espera a que aparezca verde,
    echo y despues volve a ejecutar este archivo.
    echo.
    pause
    exit /b
)
echo [OK] Docker detectado
echo.

:checkGit
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Git no encontrado. Descargando el proyecto completo...
    echo.
    echo Necesitas descargar el ZIP del proyecto desde GitHub
    echo y descomprimirlo en esta carpeta, luego volve a ejecutar.
    echo.
    pause
    exit /b
)
echo [OK] Git detectado
echo.

:cloneOrPull
if exist "STV-cambios" (
    echo [INFO] Actualizando proyecto...
    cd STV-cambios
    git pull
) else (
    echo [INFO] Descargando proyecto...
    git clone https://github.com/samu-gonz/STV-cambios.git
    cd STV-cambios
)
echo.

:build
echo [INFO] Construyendo imagen Docker (esto puede tomar varios minutos)...
docker build -t stv-cambios .
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la construccion de la imagen.
    pause
    exit /b
)
echo [OK] Imagen construida
echo.

:run
echo [INFO] Deteniendo contenedor anterior si existe...
docker stop stv 2>nul
docker rm stv 2>nul

echo [INFO] Iniciando contenedor...
docker run -d -p 80:80 --name stv stv-cambios
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al iniciar el contenedor.
    pause
    exit /b
)
echo [OK] Contenedor iniciado
echo.

echo ============================================
echo   LISTO! Abriendo navegador...
echo ============================================
echo.
echo  Si no se abre automaticamente, ingresa a:
echo  http://localhost
echo.
timeout /t 3 /nobreak >nul
start http://localhost
echo.
pause
