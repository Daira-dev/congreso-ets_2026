#!/bin/bash
# ==============================================================================
# Script: Instalar Sistema Congreso ETS 2026 (DETS - GCABA)
# Prepara dependencias, variables de entorno, base de datos y scripts
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
echo -e "${CYAN}   INSTALADOR DEL SISTEMA CONGRESO ETS 2026 - DETS GCABA (LINUX)${RESET}"
echo -e "${CYAN}========================================================================${RESET}"
echo ""

# 1. Verificar herramientas de entorno
echo -e "${CYAN}[1/6] Verificando requisitos del sistema...${RESET}"

if ! command -v node >/dev/null 2>&1; then
    echo -e "  ${RED}✗ Error: Node.js no está instalado. Instale Node.js 18 o superior.${RESET}"
    exit 1
fi

NODE_VER=$(node -v)
echo -e "  ${GREEN}✓ Node.js detectado: $NODE_VER${RESET}"

if ! command -v npm >/dev/null 2>&1; then
    echo -e "  ${RED}✗ Error: npm no está instalado.${RESET}"
    exit 1
fi
NPM_VER=$(npm -v)
echo -e "  ${GREEN}✓ npm detectado: $NPM_VER${RESET}"

# 2. Configurar variables de entorno
echo ""
echo -e "${CYAN}[2/6] Configurando variables de entorno (.env)...${RESET}"

if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    if [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
        echo "  • Creando backend/.env a partir de .env.example..."
        cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
        # Ajustar puerto por defecto a 5433 si existe contenedor Docker
        sed -i 's/:5432\//:5433\//g' "$SCRIPT_DIR/backend/.env" 2>/dev/null || true
        echo -e "  ${GREEN}✓ backend/.env configurado (puerto 5433 por defecto).${RESET}"
    else
        cat << 'EOF' > "$SCRIPT_DIR/backend/.env"
DATABASE_URL="postgresql://congreso_app:V-129057-t@localhost:5433/congreso_ets2026"
ENCRYPTION_KEY="e4b7c1a89f2d3e4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a"
CRON_SECRET="congreso_ets2026_cron_secret_48hs"
PORT=4000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="nestor.pineiro@gmail.com"
SMTP_PASS="V-129057-T"
EMAIL_FROM="Congreso ETS 2026 – DETS GCABA <nestor.pineiro@gmail.com>"
EOF
        echo -e "  ${GREEN}✓ backend/.env generado con valores por defecto.${RESET}"
    fi
else
    echo -e "  ${GREEN}✓ backend/.env ya existe.${RESET}"
fi

if [ ! -f "$SCRIPT_DIR/frontend/.env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=\"http://localhost:4000\"" > "$SCRIPT_DIR/frontend/.env.local"
    echo -e "  ${GREEN}✓ frontend/.env.local configurado.${RESET}"
else
    echo -e "  ${GREEN}✓ frontend/.env.local ya existe.${RESET}"
fi

# 3. Verificar estado de la Base de Datos PostgreSQL
echo ""
echo -e "${CYAN}[3/6] Verificando Base de Datos PostgreSQL...${RESET}"

DB_OK=false
if (echo > /dev/tcp/127.0.0.1/5433) 2>/dev/null; then
    DB_OK=true
    echo -e "  ${GREEN}✓ PostgreSQL detectado y accesible en puerto 5433.${RESET}"
elif (echo > /dev/tcp/127.0.0.1/5432) 2>/dev/null; then
    DB_OK=true
    echo -e "  ${GREEN}✓ PostgreSQL detectado y accesible en puerto 5432.${RESET}"
else
    # Intentar iniciar contenedor Docker si existe
    if command -v docker >/dev/null 2>&1; then
        if docker ps -a --format '{{.Names}}' | grep -q "^congreso_ets2026_db$"; then
            echo "  • Iniciando contenedor Docker congreso_ets2026_db..."
            docker start congreso_ets2026_db >/dev/null 2>&1 || true
            sleep 3
            if (echo > /dev/tcp/127.0.0.1/5433) 2>/dev/null; then
                DB_OK=true
                echo -e "  ${GREEN}✓ Contenedor congreso_ets2026_db iniciado exitosamente.${RESET}"
            fi
        elif [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
            echo "  • Levantando servicio de base de datos con docker compose..."
            docker compose up -d db >/dev/null 2>&1 || true
            sleep 4
            if (echo > /dev/tcp/127.0.0.1/5433) 2>/dev/null || (echo > /dev/tcp/127.0.0.1/5432) 2>/dev/null; then
                DB_OK=true
                echo -e "  ${GREEN}✓ Servicio de base de datos iniciado con Docker Compose.${RESET}"
            fi
        fi
    fi
fi

if [ "$DB_OK" = false ]; then
    echo -e "  ${YELLOW}⚠ Advertencia: No se detectó un servidor PostgreSQL activo en 5433 ni 5432.${RESET}"
    echo "    Asegúrese de levantar el contenedor o servidor PostgreSQL antes de iniciar."
fi

# 4. Instalar dependencias del Backend
echo ""
echo -e "${CYAN}[4/6] Instalando dependencias del Backend...${RESET}"
cd "$SCRIPT_DIR/backend"
npm install --no-audit --prefer-offline 2>/dev/null || npm install
echo -e "  ${GREEN}✓ Dependencias de backend instaladas con éxito.${RESET}"

# Probar conexión del backend a la base de datos si está activa
if [ "$DB_OK" = true ]; then
    echo "  • Validando conectividad del backend a PostgreSQL..."
    npm run test:db >/dev/null 2>&1 && echo -e "  ${GREEN}✓ Conectividad DB verificada.${RESET}" || echo -e "  ${YELLOW}⚠ test:db arrojó avisos (revisar credenciales si difieren).${RESET}"
fi

# 5. Instalar dependencias del Frontend
echo ""
echo -e "${CYAN}[5/6] Instalando dependencias del Frontend...${RESET}"
cd "$SCRIPT_DIR/frontend"
npm install --no-audit --prefer-offline 2>/dev/null || npm install
echo -e "  ${GREEN}✓ Dependencias de frontend instaladas con éxito.${RESET}"

# 6. Asignar permisos de ejecución e instalar Git Hooks de Calidad
echo ""
echo -e "${CYAN}[6/6] Configurando permisos y ganchos de calidad Git (pre-push)...${RESET}"
chmod +x "$SCRIPT_DIR/"*.sh "$SCRIPT_DIR/scripts/"*.sh 2>/dev/null || true
if [ -d "$SCRIPT_DIR/.git" ] && [ -f "$SCRIPT_DIR/scripts/pre-push" ]; then
    cp "$SCRIPT_DIR/scripts/pre-push" "$SCRIPT_DIR/.git/hooks/pre-push" 2>/dev/null || true
    chmod +x "$SCRIPT_DIR/.git/hooks/pre-push" 2>/dev/null || true
    echo -e "  ${GREEN}✓ Hook pre-push activado (bloqueo automático de código roto).${RESET}"
fi
echo -e "  ${GREEN}✓ Permisos aplicados a todos los scripts (*.sh).${RESET}"

echo ""
echo -e "${GREEN}========================================================================${RESET}"
echo -e "${GREEN}   INSTALACIÓN COMPLETADA EXITOSAMENTE${RESET}"
echo -e "${GREEN}========================================================================${RESET}"
echo -e "  Para iniciar el sistema ejecute:    ${CYAN}./Iniciar_Congreso.sh${RESET}"
echo -e "  Para reiniciar el sistema ejecute:  ${CYAN}./Reiniciar_Congreso.sh${RESET}"
echo -e "  Para detener el sistema ejecute:    ${CYAN}./Detener_Congreso.sh${RESET}"
echo -e "  Para desinstalar el sistema ejecute:${CYAN}./Desinstalar_Congreso.sh${RESET}"
echo ""
