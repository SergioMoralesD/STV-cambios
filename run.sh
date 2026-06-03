#!/bin/bash
echo "============================================"
echo "  STV Portal B2B - Instalador automatico"
echo "============================================"
echo "  Solo necesitas tener DOCKER instalado"
echo "============================================"
echo ""

# Check Docker
if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] Docker no esta instalado."
    echo "Descargalo: https://www.docker.com/products/docker-desktop/"
    exit 1
fi
echo "[OK] Docker detectado"

# Download project if needed
if [ ! -f "Dockerfile" ]; then
    echo "[INFO] Descargando proyecto desde GitHub..."
    curl -L -o stv-proyecto.zip https://github.com/samu-gonz/STV-cambios/archive/refs/heads/main.zip
    if [ $? -ne 0 ]; then
        echo "[ERROR] No se pudo descargar el proyecto."
        exit 1
    fi
    unzip -o stv-proyecto.zip
    cd STV-cambios-main
    echo "[OK] Proyecto descargado"
fi

# Build
echo "[INFO] Construyendo imagen Docker (5-10 minutos)..."
docker build -t stv-cambios .
if [ $? -ne 0 ]; then
    echo "[ERROR] Fallo la construccion de la imagen."
    exit 1
fi
echo "[OK] Imagen construida"

# Run
echo "[INFO] Iniciando contenedor..."
docker stop stv 2>/dev/null
docker rm stv 2>/dev/null
docker run -d -p 80:80 --name stv stv-cambios
if [ $? -ne 0 ]; then
    echo "[ERROR] Fallo al iniciar el contenedor."
    exit 1
fi
echo "[OK] Contenedor iniciado"

echo ""
echo "============================================"
echo "  LISTO!"
echo "  Abriendo http://localhost..."
echo "============================================"

case "$(uname -s)" in
    Darwin) open http://localhost ;;
    Linux)  xdg-open http://localhost 2>/dev/null || true ;;
esac
