#!/bin/bash
# ==============================================================================
# Script: Monitoreo Continuo en Vivo de Salud - Congreso ETS 2026
# Ejecuta un bucle visual en tiempo real actualizando métricas cada N segundos
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

INTERVAL=${1:-5}

CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

trap 'echo -e "\n${YELLOW}Monitoreo finalizado por el usuario.${RESET}"; exit 0' SIGINT SIGTERM

while true; do
    clear
    bash "$SCRIPT_DIR/Salud_Congreso.sh"
    echo -e "${CYAN}Presione Ctrl+C para detener el monitoreo continuo.${RESET}"
    echo -e "Próxima actualización en ${INTERVAL}s..."
    sleep "$INTERVAL"
done
