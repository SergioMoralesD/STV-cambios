#!/bin/bash
echo "============================================"
echo "  STV Portal B2B - Instalacion automatica"
echo "============================================"
echo ""

# Check Docker
if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] Docker no esta instalado o no esta ejecutandose."
    echo ""
    echo "Instalalo desde: https://www.docker.com/products/docker-desktop/"
    echo ""
    exit 1
fi
echo "[OK] Docker detectado"

# Check Git
if ! git --version >/dev/null 2>&1; then
    echo "[ERROR] Git no encontrado."
    echo "Instalalo con: apt install git (Linux) o brew install git (Mac)"
    exit 1
fi
echo "[OK] Git detectado"

# Clone or pull
if [ -d "STV-cambios" ]; then
    echo "[INFO] Actualizando proyecto..."
    cd STV-cambios
    git pull
else
    echo "[INFO] Descargando proyecto..."
    git clone https://github.com/samu-gonz/STV-cambios.git
    cd STV-cambios
fi

# Build
echo "[INFO] Construyendo imagen Docker..."
docker build -t stv-cambios .
if [ $? -ne 0 ]; then
    echo "[ERROR] Fallo la construccion de la imagen."
    exit 1
fi
echo "[OK] Imagen construida"

# Run
echo "[INFO] Deteniendo contenedor anterior si existe..."
docker stop stv 2>/dev/null
docker rm stv 2>/dev/null

echo "[INFO] Iniciando contenedor..."
docker run -d -p 80:80 --name stv stv-cambios
if [ $? -ne 0 ]; then
    echo "[ERROR] Fallo al iniciar el contenedor."
    exit 1
fi
echo "[OK] Contenedor iniciado"

echo ""
echo "============================================"
echo "  LISTO! Abriendo navegador..."
echo "============================================"
echo ""
echo "http://localhost"
echo ""

case "$(uname -s)" in
    Darwin) open http://localhost ;;
    Linux)  xdg-open http://localhost 2>/dev/null || true ;;
esac
