#!/bin/bash
# ==============================================================================
# Script: Diagnóstico Profundo y Auditoría Técnica - Congreso ETS 2026
# Audita Esquema 3FN, Integridad Criptográfica, Logs de Error y Procesos
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
echo -e "${BOLD}${CYAN}   AUDITORÍA TÉCNICA Y DIAGNÓSTICO PROFUNDO - CONGRESO ETS 2026${RESET}"
echo -e "${CYAN}========================================================================${RESET}"
echo ""

TOTAL_ISSUES=0

# 1. Auditoría de Variables de Entorno y Criptografía
echo -e "${BOLD}[1/4] Auditando configuración y claves criptográficas (.env)...${RESET}"

if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    echo -e "  ${RED}✖ [FALLO] No existe el archivo backend/.env${RESET}"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
else
    echo -e "  ${GREEN}✔ backend/.env presente${RESET}"
    
    # Validar ENCRYPTION_KEY
    ENC_KEY=$(grep -E '^ENCRYPTION_KEY=' "$SCRIPT_DIR/backend/.env" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
    if [ -z "$ENC_KEY" ]; then
        echo -e "  ${RED}✖ [FALLO] ENCRYPTION_KEY no está definida.${RESET}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    elif [ ${#ENC_KEY} -ne 64 ]; then
        echo -e "  ${RED}✖ [FALLO] ENCRYPTION_KEY debe ser de 64 caracteres hex (32 bytes). Longitud actual: ${#ENC_KEY}${RESET}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    else
        echo -e "  ${GREEN}✔ ENCRYPTION_KEY válida (AES-256-CBC, 64 hex / 256 bits)${RESET}"
    fi

    # Validar CRON_SECRET
    CRON_KEY=$(grep -E '^CRON_SECRET=' "$SCRIPT_DIR/backend/.env" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
    if [ -n "$CRON_KEY" ]; then
        echo -e "  ${GREEN}✔ CRON_SECRET configurado${RESET}"
    else
        echo -e "  ${YELLOW}⚠ CRON_SECRET no especificado (se usará valor por defecto)${RESET}"
    fi

    # Validar DATABASE_URL
    DB_URL=$(grep -E '^DATABASE_URL=' "$SCRIPT_DIR/backend/.env" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
    if echo "$DB_URL" | grep -q "postgresql://"; then
        echo -e "  ${GREEN}✔ Formato de DATABASE_URL válido: postgresql://...${RESET}"
    else
        echo -e "  ${RED}✖ Formato incorrecto en DATABASE_URL${RESET}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    fi
fi

# 2. Auditoría del Esquema de Base de Datos (26 tablas)
echo ""
echo -e "${BOLD}[2/4] Auditando integridad del esquema relacional (PostgreSQL)...${RESET}"

CRITICAL_TABLES=(
    "usuarios"
    "roles"
    "operadores"
    "eventos"
    "actividades"
    "acreditaciones"
    "certificados"
    "logs_auditoria"
    "logs_journaling"
    "puntos_acceso"
    "encuestas"
    "suscripciones_push"
)

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^congreso_ets2026_db$"; then
    MISSING_TABLES=0
    for tbl in "${CRITICAL_TABLES[@]}"; do
        EXISTS=$(docker exec congreso_ets2026_db psql -U congreso_app -d congreso_ets2026 -t -A -c "SELECT to_regclass('public.$tbl');" 2>/dev/null || echo "")
        if [ "$EXISTS" = "$tbl" ] || [ -n "$EXISTS" ]; then
            echo -e "  ${GREEN}✔ Tabla '$tbl': verificada y presente${RESET}"
        else
            echo -e "  ${RED}✖ Tabla '$tbl': NO ENCONTRADA${RESET}"
            MISSING_TABLES=$((MISSING_TABLES + 1))
        fi
    done
    if [ $MISSING_TABLES -eq 0 ]; then
        echo -e "  ${GREEN}✔ Todas las tablas críticas auditadas existen en el esquema.${RESET}"
    else
        echo -e "  ${RED}✖ Faltan $MISSING_TABLES tablas críticas en la base de datos.${RESET}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + MISSING_TABLES))
    fi
else
    echo -e "  ${YELLOW}⚠ Contenedor congreso_ets2026_db no accesible para auditoría SQL directa.${RESET}"
fi

# 3. Auditoría de Logs en busca de Errores Críticos
echo ""
echo -e "${BOLD}[3/4] Analizando archivos de registro (Logs)...${RESET}"

if [ -f "$SCRIPT_DIR/backend.log" ]; then
    BACKEND_ERRORS=$(grep -iE "error|exception|unhandled|fatal" "$SCRIPT_DIR/backend.log" | grep -v "node:internal" 2>/dev/null | tail -n 5 || true)
    if [ -n "$BACKEND_ERRORS" ]; then
        echo -e "  ${YELLOW}⚠ Avisos o errores detectados en backend.log (últimos 5):${RESET}"
        echo "$BACKEND_ERRORS" | sed 's/^/     /'
    else
        echo -e "  ${GREEN}✔ backend.log sin errores críticos registrados.${RESET}"
    fi
else
    echo -e "  • backend.log no existe aún."
fi

if [ -f "$SCRIPT_DIR/frontend.log" ]; then
    FRONTEND_ERRORS=$(grep -iE "error|failed|fatal" "$SCRIPT_DIR/frontend.log" 2>/dev/null | tail -n 5 || true)
    if [ -n "$FRONTEND_ERRORS" ]; then
        echo -e "  ${YELLOW}⚠ Avisos o errores detectados en frontend.log (últimos 5):${RESET}"
        echo "$FRONTEND_ERRORS" | sed 's/^/     /'
    else
        echo -e "  ${GREEN}✔ frontend.log sin errores críticos registrados.${RESET}"
    fi
else
    echo -e "  • frontend.log no existe aún."
fi

# 4. Auditoría de Procesos y Puertos del Host
echo ""
echo -e "${BOLD}[4/4] Verificando asignación de procesos y sockets...${RESET}"

PORTS=(3000 4000 5433)
for p in "${PORTS[@]}"; do
    if (echo > /dev/tcp/127.0.0.1/$p) 2>/dev/null; then
        PID_INFO=$(lsof -t -i:$p 2>/dev/null | head -n 1 || echo "")
        echo -e "  ${GREEN}✔ Puerto $p activo${RESET} $([ -n "$PID_INFO" ] && echo "(PID: $PID_INFO)")"
    else
        echo -e "  ${RED}✖ Puerto $p cerrado o no responde${RESET}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    fi
done

echo ""
echo -e "${CYAN}========================================================================${RESET}"
if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}✔ AUDITORÍA TÉCNICA FINALIZADA SIN DISCREPANCIAS (0 INCIDENCIAS)${RESET}"
else
    echo -e "  ${RED}${BOLD}✖ AUDITORÍA FINALIZADA CON $TOTAL_ISSUES INCIDENCIA(S) DETECTADA(S)${RESET}"
fi
echo -e "${CYAN}========================================================================${RESET}"
echo ""

exit $([ $TOTAL_ISSUES -eq 0 ] && echo 0 || echo 1)
