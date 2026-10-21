#!/bin/bash
# ==============================================================================
# Script: Desinstalar Sistema Congreso ETS 2026 (DETS - GCABA)
# Detiene servicios y remueve dependencias instaladas y artefactos de compilación
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
RESET="\033[0m"

echo -e "${RED}========================================================================${RESET}"
echo -e "${RED}   DESINSTALADOR DEL SISTEMA CONGRESO ETS 2026 - DETS GCABA (LINUX)${RESET}"
echo -e "${RED}========================================================================${RESET}"
echo ""

# Confirmación de seguridad si se ejecuta interactivamente sin -y / --yes
AUTO_CONFIRM=false
PURGE_DB=false

for arg in "$@"; do
    case "$arg" in
        -y|--yes)
            AUTO_CONFIRM=true
            ;;
        --with-db|--purge-all)
            PURGE_DB=true
            ;;
    esac
done

if [ "$AUTO_CONFIRM" = false ] && [ -t 0 ]; then
    echo -e "${YELLOW}Esta acción realizará:${RESET}"
    echo "  1. Detención de todos los servicios activos (puertos 3000 y 4000)."
    echo "  2. Eliminación de las carpetas node_modules (backend y frontend)."
    echo "  3. Eliminación de la caché de build (.next, dist, out)."
    echo "  4. Eliminación de archivos temporales de logs y PIDs."
    if [ "$PURGE_DB" = true ]; then
        echo -e "  ${RED}5. ELIMINACIÓN de datos y volúmenes de PostgreSQL (--with-db indicado).${RESET}"
    else
        echo -e "  ${GREEN}* Nota: La base de datos y configuraciones (.env) se conservarán intactas.${RESET}"
    fi
    echo ""
    read -p "¿Desea continuar con la desinstalación? (s/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
        echo -e "${YELLOW}Desinstalación cancelada por el usuario.${RESET}"
        exit 0
    fi
fi

# 1. Detener servicios en ejecución
echo ""
echo -e "${CYAN}[1/4] Deteniendo servicios activos...${RESET}"
if [ -f "$SCRIPT_DIR/Detener_Congreso.sh" ]; then
    bash "$SCRIPT_DIR/Detener_Congreso.sh"
else
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 4000/tcp 2>/dev/null || true
fi

# 2. Eliminar artefactos de compilación y temporales
echo ""
echo -e "${CYAN}[2/4] Limpiando artefactos de compilación y logs...${RESET}"
rm -rf "$SCRIPT_DIR/frontend/.next"
rm -rf "$SCRIPT_DIR/frontend/out"
rm -rf "$SCRIPT_DIR/backend/dist"
rm -f "$SCRIPT_DIR/backend.log" "$SCRIPT_DIR/frontend.log"
rm -f "$SCRIPT_DIR/.backend.pid" "$SCRIPT_DIR/.frontend.pid"
echo -e "  ${GREEN}✓ Caché y logs eliminados.${RESET}"

# 3. Eliminar dependencias node_modules
echo ""
echo -e "${CYAN}[3/4] Eliminando dependencias de Node.js (node_modules)...${RESET}"
if [ -d "$SCRIPT_DIR/backend/node_modules" ]; then
    echo "  • Eliminando backend/node_modules..."
    rm -rf "$SCRIPT_DIR/backend/node_modules"
fi
if [ -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "  • Eliminando frontend/node_modules..."
    rm -rf "$SCRIPT_DIR/frontend/node_modules"
fi
echo -e "  ${GREEN}✓ Dependencias de paquetes eliminadas.${RESET}"

# 4. Manejo de base de datos si se solicitó purga
echo ""
echo -e "${CYAN}[4/4] Verificando estado de persistencia...${RESET}"
if [ "$PURGE_DB" = true ]; then
    echo -e "  ${RED}• Purgando contenedores y volúmenes de base de datos...${RESET}"
    if command -v docker >/dev/null 2>&1; then
        docker stop congreso_ets2026_db 2>/dev/null || true
        docker rm congreso_ets2026_db 2>/dev/null || true
        docker volume rm congreso_ets2026_postgres_data 2>/dev/null || true
    fi
    echo -e "  ${RED}✓ Base de datos removida.${RESET}"
else
    echo -e "  ${GREEN}✓ Base de datos y archivos .env preservados.${RESET}"
fi

echo ""
echo -e "${GREEN}========================================================================${RESET}"
echo -e "${GREEN}   DESINSTALACIÓN COMPLETADA EXITOSAMENTE${RESET}"
echo -e "${GREEN}========================================================================${RESET}"
echo -e "  Para reinstalar el sistema en cualquier momento, ejecute: ${CYAN}./Instalar_Congreso.sh${RESET}"
echo ""
