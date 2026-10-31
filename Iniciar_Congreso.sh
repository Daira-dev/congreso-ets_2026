#!/bin/bash
# ==============================================================================
# Script: Iniciar Sistema Congreso ETS 2026 (DETS - GCABA)
# Backend (Puerto 4000) + Frontend (Puerto 3000)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
RESET="\033[0m"

echo -e "${CYAN}========================================================================${RESET}"
echo -e "${CYAN}   INICIANDO SISTEMA CONGRESO ETS 2026 - DETS GCABA (LINUX)${RESET}"
echo -e "${CYAN}========================================================================${RESET}"
echo ""

# 0. Verificar base de datos PostgreSQL
if ! (echo > /dev/tcp/127.0.0.1/5433) 2>/dev/null && ! (echo > /dev/tcp/127.0.0.1/5432) 2>/dev/null; then
    echo "  • Base de datos no detectada. Intentando iniciar contenedor Docker..."
    if command -v docker >/dev/null 2>&1; then
        if docker ps -a --format '{{.Names}}' | grep -q "^congreso_ets2026_db$"; then
            docker start congreso_ets2026_db >/dev/null 2>&1 || true
            sleep 2
        elif [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
            docker compose up -d db >/dev/null 2>&1 || true
            sleep 3
        fi
    fi
fi

# 0.1 Sincronización con origin desactivada por política estricta (GitHub solo bajo pedido expreso)
# CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "nestor-HERO")

# Verificar si ya está en ejecución
BACKEND_ACTIVE=false
FRONTEND_ACTIVE=false

if (echo > /dev/tcp/127.0.0.1/4000) 2>/dev/null; then
    BACKEND_ACTIVE=true
fi

if (echo > /dev/tcp/127.0.0.1/3000) 2>/dev/null; then
    FRONTEND_ACTIVE=true
fi

if [ "$BACKEND_ACTIVE" = true ] && [ "$FRONTEND_ACTIVE" = true ]; then
    echo -e "${YELLOW}  [AVISO] El sistema ya se encuentra en ejecución en los puertos 4000 y 3000.${RESET}"
    echo "  Abriendo navegador web..."
    if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; then
        xdg-open "http://localhost:3000" 2>/dev/null || sensible-browser "http://localhost:3000" 2>/dev/null || true
    fi
    exit 0
fi

# 1. Iniciar Backend (Puerto 4000) si no está activo
if [ "$BACKEND_ACTIVE" = true ]; then
    echo -e "${YELLOW}  [1/2] El Backend ya está escuchando en el puerto 4000.${RESET}"
else
    echo "  [1/2] Iniciando Servidor Backend API (Puerto 4000)..."
    if [ -d "$SCRIPT_DIR/backend" ]; then
        (
            cd "$SCRIPT_DIR/backend"
            setsid nohup npm run dev > "$SCRIPT_DIR/backend.log" 2>&1 < /dev/null &
            echo $! > "$SCRIPT_DIR/.backend.pid"
        )
        BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid" 2>/dev/null || true)
        echo -e "        ${GREEN}✓ Proceso Backend lanzado (PID: $BACKEND_PID). Log: backend.log${RESET}"
    else
        echo -e "        ${RED}✗ No se encontró el directorio backend en $SCRIPT_DIR${RESET}"
        exit 1
    fi
fi

# Esperar disponibilidad del Backend antes de arrancar Frontend
echo "        Esperando disponibilidad del Backend en http://localhost:4000..."
BACKEND_READY=false
for i in {1..25}; do
    if (echo > /dev/tcp/127.0.0.1/4000) 2>/dev/null; then
        BACKEND_READY=true
        break
    fi
    sleep 0.4
done

if [ "$BACKEND_READY" = true ]; then
    echo -e "        ${GREEN}✓ Backend disponible en puerto 4000.${RESET}"
else
    echo -e "        ${YELLOW}⚠ El Backend tardó en responder. Continuando con Frontend...${RESET}"
fi

# 2. Iniciar Frontend (Puerto 3000) si no está activo
if [ "$FRONTEND_ACTIVE" = true ]; then
    echo -e "${YELLOW}  [2/2] El Frontend ya está escuchando en el puerto 3000.${RESET}"
else
    echo "  [2/2] Iniciando Interfaz Frontend Web (Puerto 3000)..."
    if [ -d "$SCRIPT_DIR/frontend" ]; then
        (
            cd "$SCRIPT_DIR/frontend"
            setsid nohup npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 < /dev/null &
            echo $! > "$SCRIPT_DIR/.frontend.pid"
        )
        FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid" 2>/dev/null || true)
        echo -e "        ${GREEN}✓ Proceso Frontend lanzado (PID: $FRONTEND_PID). Log: frontend.log${RESET}"
    else
        echo -e "        ${RED}✗ No se encontró el directorio frontend en $SCRIPT_DIR${RESET}"
        exit 1
    fi
fi

echo ""
echo "  Esperando disponibilidad de la plataforma en http://localhost:3000..."
FRONTEND_READY=false
for i in {1..35}; do
    if (echo > /dev/tcp/127.0.0.1/3000) 2>/dev/null; then
        FRONTEND_READY=true
        break
    fi
    sleep 0.5
done

echo ""
if [ "$FRONTEND_READY" = true ]; then
    echo -e "${GREEN}========================================================================${RESET}"
    echo -e "${GREEN}   SISTEMA CONGRESO ETS 2026 INICIADO CORRECTAMENTE${RESET}"
    echo -e "${GREEN}========================================================================${RESET}"
    echo -e "  • Frontend Web : ${CYAN}http://localhost:3000${RESET}"
    echo -e "  • Backend API  : ${CYAN}http://localhost:4000${RESET}"
    echo -e "  • Logs Backend : ${YELLOW}$SCRIPT_DIR/backend.log${RESET}"
    echo -e "  • Logs Frontend: ${YELLOW}$SCRIPT_DIR/frontend.log${RESET}"
    echo ""
    echo "  Abriendo navegador..."
    if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; then
        xdg-open "http://localhost:3000" 2>/dev/null || sensible-browser "http://localhost:3000" 2>/dev/null || true
    fi
else
    echo -e "${YELLOW}========================================================================${RESET}"
    echo -e "${YELLOW}   SERVICIOS INICIADOS - COMPILACIÓN EN PROGRESO${RESET}"
    echo -e "${YELLOW}========================================================================${RESET}"
    echo "  Los procesos están ejecutándose en segundo plano. Puede demorar unos segundos."
    echo "  Verifique los logs con: tail -f backend.log o tail -f frontend.log"
fi
echo ""
