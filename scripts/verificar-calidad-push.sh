#!/bin/bash
# ==============================================================================
# Script: Árbitro de Calidad Pre-Push - Método Gauntlet v2
# Bloquea incondicionalmente cualquier push si el código está roto o incompleto
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

echo -e "${CYAN}========================================================================${RESET}"
echo -e "${BOLD}${CYAN}   ÁRBITRO ADVERSARIAL PRE-PUSH (MÉTODO GAUNTLET v2)${RESET}"
echo -e "${CYAN}   Validando código antes de autorizar el envío a GitHub...${RESET}"
echo -e "${CYAN}========================================================================${RESET}"
echo ""

ERRORS=0

# 1. Vector Seguridad: Verificar que no haya archivos sensibles en commits locales
echo -e "${BOLD}[1/4] Auditando seguridad y prevención de fuga de credenciales...${RESET}"
STAGED_OR_COMMITTED_FILES=$(git log origin/$(git branch --show-current 2>/dev/null || echo "nestor-HERO")..HEAD --name-only 2>/dev/null || true)
if echo "$STAGED_OR_COMMITTED_FILES" | grep -iE '\.env$|\.env\.local$|\.pem$|\.key$' | grep -v '\.env\.example'; then
    echo -e "  ${RED}✖ [BLOQUEO CRÍTICO] Se detectaron archivos de secretos (.env, .pem, .key) en los commits pendientes.${RESET}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "  ${GREEN}✔ Ningún secreto ni archivo confidencial detectado.${RESET}"
fi

# 2. Vector Backend: Compilación y Tipado TypeScript Estricto
echo ""
echo -e "${BOLD}[2/4] Verificando compilación y contratos de tipo en Backend API...${RESET}"
if [ -d "$SCRIPT_DIR/backend" ]; then
    if (cd "$SCRIPT_DIR/backend" && npx tsc --noEmit 2>&1 | sed 's/^/    /'); then
        echo -e "  ${GREEN}✔ Backend TypeScript validado (0 errores sintácticos o de tipado).${RESET}"
    else
        echo -e "  ${RED}✖ [BLOQUEO] Errores detectados en TypeScript del Backend. Código incompleto.${RESET}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 3. Vector Frontend: Compilación y Tipado TypeScript Estricto
echo ""
echo -e "${BOLD}[3/4] Verificando compilación y componentes en Frontend Web (Next.js)...${RESET}"
if [ -d "$SCRIPT_DIR/frontend" ]; then
    if (cd "$SCRIPT_DIR/frontend" && npx tsc --noEmit 2>&1 | sed 's/^/    /'); then
        echo -e "  ${GREEN}✔ Frontend TypeScript validado (0 errores de interfaces o render).${RESET}"
    else
        echo -e "  ${RED}✖ [BLOQUEO] Errores detectados en componentes de Frontend. Código incompleto.${RESET}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 4. Vector Gauntlet: Detección de marcadores placeholder prohibidos en archivos de código
echo ""
echo -e "${BOLD}[4/4] Verificando regla indiscutible de Cero Placeholders...${RESET}"
BRANCH=$(git branch --show-current 2>/dev/null || echo "nestor-HERO")
DIFF_PENDING=$(git diff origin/"$BRANCH"..HEAD -- ':(exclude)scripts/verificar-calidad-push.sh' 2>/dev/null || true)

if echo "$DIFF_PENDING" | grep -iE '^[+].*(TODO: completar|FIXME: resolver|throw new Error\("not implemented"\)|Lorem ipsum)'; then
    echo -e "  ${RED}✖ [BLOQUEO] Se detectaron placeholders prohibidos (TODO/FIXME/Lorem ipsum) en el código nuevo.${RESET}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "  ${GREEN}✔ Código de la aplicación libre de placeholders o funciones simuladas.${RESET}"
fi

echo ""
echo -e "${CYAN}========================================================================${RESET}"
if [ $ERRORS -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}✔ PUSH AUTORIZADO: El código es completo, seguro y válido.${RESET}"
    echo -e "${CYAN}========================================================================${RESET}"
    echo ""
    exit 0
else
    echo -e "  ${RED}${BOLD}✖ PUSH ABORTADO POR EL ÁRBITRO (${ERRORS} fallos detectados).${RESET}"
    echo -e "  ${YELLOW}No se subió nada a GitHub. Corrige los errores listados arriba y reintenta.${RESET}"
    echo -e "${CYAN}========================================================================${RESET}"
    echo ""
    exit 1
fi
