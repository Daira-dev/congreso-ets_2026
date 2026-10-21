#!/bin/bash
# ==============================================================================
# Script: Diagnóstico y Salud del Sistema - Congreso ETS 2026 (DETS - GCABA)
# Verifica Base de Datos, Backend API, Frontend Web, Procesos y Recursos
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
BOLD="\033[1m"
RESET="\033[0m"

# Argumentos de entrada
MODE_JSON=false
MODE_QUIET=false
MODE_REPAIR=false

for arg in "$@"; do
    case "$arg" in
        --json)
            MODE_JSON=true
            ;;
        --quiet|-q)
            MODE_QUIET=true
            ;;
        --repair|-r)
            MODE_REPAIR=true
            ;;
    esac
done

# Variables de recolección de estado
STATUS_CODE=0 # 0=OK, 1=DEGRADED, 2=CRITICAL

# 1. Chequeo de Base de Datos PostgreSQL
DB_PORT=5433
DB_ONLINE=false
DB_CONTAINER_RUNNING=false
DB_TABLES_COUNT=0
DB_LATENCY_MS="N/A"

if command -v docker >/dev/null 2>&1; then
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^congreso_ets2026_db$"; then
        DB_CONTAINER_RUNNING=true
    fi
fi

if (echo > /dev/tcp/127.0.0.1/5433) 2>/dev/null; then
    DB_PORT=5433
    DB_ONLINE=true
elif (echo > /dev/tcp/127.0.0.1/5432) 2>/dev/null; then
    DB_PORT=5432
    DB_ONLINE=true
fi

# Conteo de tablas si docker está disponible
if [ "$DB_CONTAINER_RUNNING" = true ]; then
    DB_TABLES_COUNT=$(docker exec congreso_ets2026_db psql -U congreso_app -d congreso_ets2026 -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
fi

# 2. Chequeo de Backend API (Puerto 4000)
BACKEND_ONLINE=false
BACKEND_PID="N/A"
BACKEND_PID_RUNNING=false
BACKEND_HEALTH_STATUS="DOWN"
BACKEND_DB_CONNECTED="false"
BACKEND_UPTIME="0"
BACKEND_MEMORY_MB="0"
BACKEND_LATENCY_MS="0"
BACKEND_VACANTES_STATUS=false

if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid" 2>/dev/null || true)
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        BACKEND_PID_RUNNING=true
    fi
fi

if (echo > /dev/tcp/127.0.0.1/4000) 2>/dev/null; then
    BACKEND_ONLINE=true
    # Consultar /health
    HEALTH_RESP=$(curl -s --max-time 3 "http://localhost:4000/health" 2>/dev/null || echo "{}")
    if echo "$HEALTH_RESP" | grep -q '"status":"UP"'; then
        BACKEND_HEALTH_STATUS="UP"
        BACKEND_DB_CONNECTED=$(echo "$HEALTH_RESP" | grep -o '"connected":[^,}]*' | cut -d: -f2 || echo "false")
        BACKEND_LATENCY_MS=$(echo "$HEALTH_RESP" | grep -o '"latencyMs":[^,}]*' | cut -d: -f2 || echo "0")
        BACKEND_UPTIME=$(echo "$HEALTH_RESP" | grep -o '"uptimeSeconds":[^,}]*' | cut -d: -f2 || echo "0")
        BACKEND_MEMORY_MB=$(echo "$HEALTH_RESP" | grep -o '"memoryUsageMb":[^,}]*' | cut -d: -f2 || echo "0")
    fi
    # Probar endpoint funcional de vacantes
    VACANTES_RESP=$(curl -s --max-time 3 "http://localhost:4000/api/vacantes" 2>/dev/null || echo "{}")
    if echo "$VACANTES_RESP" | grep -q 'cupo_maximo'; then
        BACKEND_VACANTES_STATUS=true
    fi
fi

# 3. Chequeo de Frontend Web (Puerto 3000)
FRONTEND_ONLINE=false
FRONTEND_PID="N/A"
FRONTEND_PID_RUNNING=false
FRONTEND_HTTP_CODE="000"

if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid" 2>/dev/null || true)
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        FRONTEND_PID_RUNNING=true
    fi
fi

if (echo > /dev/tcp/127.0.0.1/3000) 2>/dev/null; then
    FRONTEND_ONLINE=true
    FRONTEND_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://localhost:3000" 2>/dev/null || echo "000")
fi

# 4. Recursos del Host
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}')
DISK_FREE=$(df -h . | awk 'NR==2 {print $4}')
RAM_TOTAL_MB=$(free -m | awk '/Mem:/ {print $2}')
RAM_AVAIL_MB=$(free -m | awk '/Mem:/ {print $7}')

# 5. Evaluación de estado general
if [ "$DB_ONLINE" = false ] || [ "$BACKEND_ONLINE" = false ] || [ "$FRONTEND_ONLINE" = false ]; then
    STATUS_CODE=2 # CRITICAL
elif [ "$BACKEND_HEALTH_STATUS" != "UP" ] || [ "$FRONTEND_HTTP_CODE" != "200" ]; then
    STATUS_CODE=1 # DEGRADED
else
    STATUS_CODE=0 # HEALTHY
fi

# Acción de auto-reparación si fue solicitada
if [ "$MODE_REPAIR" = true ] && [ "$STATUS_CODE" -ne 0 ]; then
    if [ "$MODE_QUIET" = false ] && [ "$MODE_JSON" = false ]; then
        echo -e "${YELLOW}  [AUTO-REPARACIÓN] Intentando recuperar servicios degradados...${RESET}"
    fi
    if [ "$DB_ONLINE" = false ] && [ command -v docker >/dev/null 2>&1 ]; then
        docker start congreso_ets2026_db >/dev/null 2>&1 || true
    fi
    if [ "$BACKEND_ONLINE" = false ] || [ "$FRONTEND_ONLINE" = false ]; then
        bash "$SCRIPT_DIR/Reiniciar_Congreso.sh" >/dev/null 2>&1 || true
    fi
    # Re-ejecutar diagnóstico tras reparación
    exec "$0" $([ "$MODE_JSON" = true ] && echo "--json") $([ "$MODE_QUIET" = true ] && echo "--quiet")
fi

# 6. Salida en modo JSON
if [ "$MODE_JSON" = true ]; then
    cat << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "overall_status": "$([ "$STATUS_CODE" -eq 0 ] && echo "HEALTHY" || ([ "$STATUS_CODE" -eq 1 ] && echo "DEGRADED" || echo "CRITICAL"))",
  "status_code": $STATUS_CODE,
  "database": {
    "online": $DB_ONLINE,
    "port": $DB_PORT,
    "container_running": $DB_CONTAINER_RUNNING,
    "tables_count": ${DB_TABLES_COUNT:-0},
    "connected_from_backend": $BACKEND_DB_CONNECTED,
    "latency_ms": $BACKEND_LATENCY_MS
  },
  "backend": {
    "online": $BACKEND_ONLINE,
    "port": 4000,
    "pid": "$BACKEND_PID",
    "pid_running": $BACKEND_PID_RUNNING,
    "health_status": "$BACKEND_HEALTH_STATUS",
    "uptime_seconds": $BACKEND_UPTIME,
    "memory_mb": $BACKEND_MEMORY_MB,
    "endpoint_vacantes_ok": $BACKEND_VACANTES_STATUS
  },
  "frontend": {
    "online": $FRONTEND_ONLINE,
    "port": 3000,
    "pid": "$FRONTEND_PID",
    "pid_running": $FRONTEND_PID_RUNNING,
    "http_code": "$FRONTEND_HTTP_CODE"
  },
  "system_resources": {
    "disk_usage_percent": "$DISK_USAGE",
    "disk_free": "$DISK_FREE",
    "ram_total_mb": $RAM_TOTAL_MB,
    "ram_available_mb": $RAM_AVAIL_MB
  }
}
EOF
    exit $STATUS_CODE
fi

# 7. Salida en modo silencioso (solo exit code)
if [ "$MODE_QUIET" = true ]; then
    exit $STATUS_CODE
fi

# 8. Salida en modo interactivo legible
echo -e "${CYAN}========================================================================${RESET}"
echo -e "${BOLD}${CYAN}   DIAGNÓSTICO Y SALUD DEL SISTEMA - CONGRESO ETS 2026${RESET}"
echo -e "${CYAN}========================================================================${RESET}"
echo -e "Fecha y Hora : $(date +"%Y-%m-%d %H:%M:%S %Z")"
echo -e "Directorio   : $SCRIPT_DIR"
echo ""

# Estado General
echo -n "Estado General del Sistema: "
if [ "$STATUS_CODE" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}[ ÓPTIMO / HEALTHY ]${RESET}"
elif [ "$STATUS_CODE" -eq 1 ]; then
    echo -e "${YELLOW}${BOLD}[ DEGRADADO / WARNING ]${RESET}"
else
    echo -e "${RED}${BOLD}[ CRÍTICO / DOWN ]${RESET}"
fi
echo ""

# Detalle por capas
echo -e "${BOLD}1. Base de Datos Relacional (PostgreSQL)${RESET}"
if [ "$DB_ONLINE" = true ]; then
    echo -e "  • Puerto de Escucha   : ${GREEN}127.0.0.1:$DB_PORT [CONECTADO]${RESET}"
else
    echo -e "  • Puerto de Escucha   : ${RED}127.0.0.1:5433 [CERRADO]${RESET}"
fi
if [ "$DB_CONTAINER_RUNNING" = true ]; then
    echo -e "  • Contenedor Docker   : ${GREEN}congreso_ets2026_db [UP]${RESET}"
    echo -e "  • Tablas en Esquema   : ${GREEN}$DB_TABLES_COUNT tablas detectadas${RESET}"
else
    echo -e "  • Contenedor Docker   : ${YELLOW}No detectado en ejecución directa${RESET}"
fi
if [ "$BACKEND_DB_CONNECTED" = "true" ]; then
    echo -e "  • Conexión desde API  : ${GREEN}Activa (Latencia: ${BACKEND_LATENCY_MS} ms)${RESET}"
else
    echo -e "  • Conexión desde API  : ${RED}Inactiva o Desconectada${RESET}"
fi
echo ""

echo -e "${BOLD}2. Servidor Backend API (Express / TypeScript)${RESET}"
if [ "$BACKEND_ONLINE" = true ]; then
    echo -e "  • Puerto 4000         : ${GREEN}[ABIERTO]${RESET}"
    echo -e "  • Endpoint /health    : ${GREEN}HTTP 200 ($BACKEND_HEALTH_STATUS)${RESET}"
    echo -e "  • Tiempo de Actividad : ${CYAN}$(($BACKEND_UPTIME / 60)) min ($BACKEND_UPTIME seg)${RESET}"
    echo -e "  • Consumo de Memoria  : ${CYAN}${BACKEND_MEMORY_MB} MB (RSS Heap)${RESET}"
    if [ "$BACKEND_VACANTES_STATUS" = true ]; then
        echo -e "  • Lógica /api/vacantes: ${GREEN}[OK] Reglas de cupo operativas${RESET}"
    else
        echo -e "  • Lógica /api/vacantes: ${RED}[FALLO] Error en endpoint funcional${RESET}"
    fi
else
    echo -e "  • Puerto 4000         : ${RED}[CERRADO / INACTIVO]${RESET}"
fi
if [ "$BACKEND_PID_RUNNING" = true ]; then
    echo -e "  • Proceso Local PID   : ${GREEN}$BACKEND_PID [ACTIVO]${RESET}"
else
    echo -e "  • Proceso Local PID   : ${YELLOW}No registrado en .backend.pid${RESET}"
fi
echo ""

echo -e "${BOLD}3. Portal Frontend Web (Next.js 16 / Turbopack)${RESET}"
if [ "$FRONTEND_ONLINE" = true ]; then
    echo -e "  • Puerto 3000         : ${GREEN}[ABIERTO]${RESET}"
    if [ "$FRONTEND_HTTP_CODE" = "200" ]; then
        echo -e "  • Respuesta HTTP      : ${GREEN}HTTP $FRONTEND_HTTP_CODE OK (Renderizado SSR activo)${RESET}"
    else
        echo -e "  • Respuesta HTTP      : ${YELLOW}HTTP $FRONTEND_HTTP_CODE (Revisar compilación)${RESET}"
    fi
else
    echo -e "  • Puerto 3000         : ${RED}[CERRADO / INACTIVO]${RESET}"
fi
if [ "$FRONTEND_PID_RUNNING" = true ]; then
    echo -e "  • Proceso Local PID   : ${GREEN}$FRONTEND_PID [ACTIVO]${RESET}"
else
    echo -e "  • Proceso Local PID   : ${YELLOW}No registrado en .frontend.pid${RESET}"
fi
echo ""

echo -e "${BOLD}4. Recursos de la Máquina Host${RESET}"
echo -e "  • Almacenamiento      : ${CYAN}$DISK_FREE disponible (Uso: $DISK_USAGE)${RESET}"
echo -e "  • Memoria RAM         : ${CYAN}$RAM_AVAIL_MB MB libres de $RAM_TOTAL_MB MB${RESET}"
echo ""

echo -e "${CYAN}========================================================================${RESET}"
if [ "$STATUS_CODE" -eq 0 ]; then
    echo -e "  ${GREEN}✔ Todos los componentes se encuentran en estado saludable.${RESET}"
    echo -e "  • Portal de Usuario : ${CYAN}http://localhost:3000${RESET}"
    echo -e "  • API Diagnóstica   : ${CYAN}http://localhost:4000/health${RESET}"
else
    echo -e "  ${RED}✖ Se han detectado anomalías o servicios caídos.${RESET}"
    echo -e "  • Para reparar automáticamente ejecute : ${CYAN}./Salud_Congreso.sh --repair${RESET}"
    echo -e "  • O bien reinicie los servicios con    : ${CYAN}./Reiniciar_Congreso.sh${RESET}"
fi
echo -e "${CYAN}========================================================================${RESET}"
echo ""

exit $STATUS_CODE
