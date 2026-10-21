#!/bin/bash
# ==============================================================================
# Script: Sincronización Automática con GitHub - Congreso ETS 2026
# Gestiona pull, add, commit y push hacia la rama activa de forma autónoma
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
BOLD="\033[1m"
RESET="\033[0m"

# Configuración por defecto
INTERVAL_SEC=180 # 3 minutos en modo watcher
DAEMON_MODE=false
CUSTOM_MSG=""

for arg in "$@"; do
    case "$arg" in
        --watch|-w)
            DAEMON_MODE=true
            ;;
        --interval=*|-i=*)
            INTERVAL_SEC="${arg#*=}"
            ;;
        --msg=*)
            CUSTOM_MSG="${arg#*=}"
            ;;
    esac
done

sync_now() {
    local branch
    branch=$(git branch --show-current 2>/dev/null || echo "nestor-HERO")
    
    echo -e "${CYAN}• Verificando repositorio en rama [${BOLD}$branch${RESET}${CYAN}]...${RESET}"
    
    local has_local_changes=false
    if [ -n "$(git status --porcelain)" ]; then
        has_local_changes=true
    fi

    # 1. Si hay cambios locales, committear primero para preservar el trabajo
    if [ "$has_local_changes" = true ]; then
        echo "  • Cambios locales detectados. Creando commit local..."
        git add .

        local commit_message
        if [ -n "$CUSTOM_MSG" ]; then
            commit_message="$CUSTOM_MSG"
        else
            commit_message="auto(sync): guardado automatico en $branch [$(date +'%Y-%m-%d %H:%M:%S')]"
        fi

        git commit -m "$commit_message" 2>&1 | sed 's/^/    /'
    fi

    # 2. Traer novedades remotas con rebase
    if git remote get-url origin >/dev/null 2>&1; then
        echo "  • Sincronizando con actualizaciones remotas (git pull --rebase)..."
        if ! git pull --rebase origin "$branch" 2>&1 | sed 's/^/    /'; then
            echo -e "  ${YELLOW}⚠ Advertencia: Conflicto durante rebase. Requiere revisión manual.${RESET}"
            return 1
        fi
    fi

    # 3. Empujar cambios si hubo commit o si hay commits locales pendientes
    local unpushed_commits
    unpushed_commits=$(git log "origin/$branch..HEAD" --oneline 2>/dev/null || echo "")

    if [ -n "$unpushed_commits" ]; then
        echo "  • Subiendo commits locales a GitHub (git push origin $branch)..."
        git push origin "$branch" 2>&1 | sed 's/^/    /'
        echo -e "  ${GREEN}✔ Cambios sincronizados exitosamente con GitHub.${RESET}"
    else
        echo -e "  ${GREEN}✔ El repositorio ya se encuentra totalmente al día con GitHub.${RESET}"
    fi

    return 0
}

# Ejecución según modo
if [ "$DAEMON_MODE" = true ]; then
    echo -e "${CYAN}========================================================================${RESET}"
    echo -e "${BOLD}${CYAN}   INICIANDO AUTOSYNC EN SEGUNDO PLANO (MONITOREO CADA ${INTERVAL_SEC}s)${RESET}"
    echo -e "${CYAN}========================================================================${RESET}"
    echo -e "Directorio : $SCRIPT_DIR"
    echo -e "Presione ${YELLOW}Ctrl+C${RESET} para detener el proceso."
    echo ""

    trap 'echo -e "\n${YELLOW}Autosync detenido por el usuario.${RESET}"; exit 0' SIGINT SIGTERM

    while true; do
        if [ -n "$(git status --porcelain)" ]; then
            echo -e "\n[$(date +'%T')] Cambios detectados en el repositorio:"
            sync_now || true
        fi
        sleep "$INTERVAL_SEC"
    done
else
    # Ejecución inmediata one-shot
    sync_now
fi
