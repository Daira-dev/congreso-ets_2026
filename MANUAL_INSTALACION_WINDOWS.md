# Manual de Instalación y Despliegue en Windows 10 y Windows 11
## Sistema de Gestión Integral – Congreso ETS 2026 (DETS - GCABA)

Este manual documenta el procedimiento completo, auditado y validado para instalar, auditar, versionar y ejecutar la plataforma **Congreso ETS 2026** en equipos con sistemas operativos **Microsoft Windows 10 y Windows 11 (64-bit)**.

---

## 📋 1. Requisitos del Sistema

### Hardware Mínimo Recomendado
- **Procesador:** Intel Core i3 / AMD Ryzen 3 o superior (arquitectura x64).
- **Memoria RAM:** 4 GB mínimo (8 GB recomendado para compilación y desarrollo).
- **Espacio en Disco:** 3 GB de espacio libre disponible.
- **Red:** Conexión a Internet para la descarga inicial de paquetes de dependencias y configuración SMTP.

### Software Previo Requerido (Prerrequisitos)
El instalador audita y verifica automáticamente la presencia y estado de estos componentes en tiempo real:

1. **Node.js LTS (Versión 18.18.0 o superior; recomendado v20.x, v22.x o v24.x LTS):**
   - Descarga oficial: [https://nodejs.org/es/download](https://nodejs.org/es/download)
   - *Nota:* Durante la instalación en Windows, asegúrese de marcar la casilla *"Add to PATH"*.
2. **NPM Package Manager (Versión 10.x o superior):**
   - Se incluye y enlaza automáticamente junto con el paquete de Node.js.
3. **PostgreSQL Database Server (Versión 14, 15, 16 o 17):**
   - Descarga oficial (instalador EnterpriseDB para Windows): [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
   - Durante la instalación, recuerde la contraseña asignada al superusuario `postgres` y el puerto local asignado (habitualmente `5432` o `5433`).
4. **Git for Windows (Opcional / Recomendado - v2.x):**
   - Descarga oficial: [https://git-scm.com/download/win](https://git-scm.com/download/win)
   - Permite el control de versiones local, sincronización y auditoría de cambios del repositorio.

---

## 🚀 2. Proceso de Instalación Paso a Paso

### Flexibilidad de Directorios (Instalación DESDE y HACIA cualquier carpeta)
El instalador está programado para ser **100% independiente de rutas absolutas**:
- **Origen:** Puede ejecutarse desde cualquier unidad de disco (`C:\`, `D:\`, pendrive USB `E:\`) o carpetas con espacios (ej. `D:\00_CongresoETS2026_Installer_Win`).
- **Destino:** Permite seleccionar libremente la carpeta de instalación mediante un explorador gráfico (`C:\CongresoETS2026`, `D:\00_Congreso`, `D:\Sistemas\Congreso 2026`, etc.).

---

### Paso 1: Ejecutar el Asistente
1. Abra la carpeta donde descomprimió o clonó el paquete del instalador (`00_CongresoETS2026_Installer_Win`).
2. Haga **doble clic** sobre:
   ```cmd
   Instalar_CongresoETS2026.bat
   ```
3. *Permisos:* El instalador se ejecutará directamente con permisos de usuario local. Si desea instalar en carpetas protegidas del sistema operativo (como `C:\Program Files`), haga clic derecho sobre el archivo `.bat` y seleccione **"Ejecutar como administrador"**.

---

### Paso 2: Auditoría Diagnóstica en Tiempo Real
Antes de realizar cualquier copia o modificación, el instalador inspecciona los servicios locales y despliega una tabla de diagnóstico:

```text
 ==========================================================================
   ESTADO DE SERVICIOS Y PRERREQUISITOS DEL SISTEMA                        
 ==========================================================================

 [ OK       ] Node.js Runtime              : Instalado (v24.21.0)
 [ OK       ] NPM Package Manager          : Instalado (v11.19.0)
 [ OK       ] PostgreSQL Database          : Instalado y activo en puerto 5433
 [ OK       ] Git for Windows (Opcional)   : Instalado (v2.55.0)
 [ OK       ] Puertos Web (3000 / 4000)    : Puertos 3000 y 4000 disponibles

  ========================================================================
   TODOS LOS SERVICIOS Y REQUISITOS OBLIGATORIOS ESTAN CUBIERTOS [OK]     
  ========================================================================
```

#### ¿Qué ocurre si falta algún servicio crítico?
Si falta Node.js o PostgreSQL está detenido:
- El componente se marcará en **rojo `[ FALTA ]`** o **amarillo `[ DETENIDO ]`**.
- El asistente presentará un menú interactivo:
  - **`[1]`** Abre el navegador web en la descarga de Node.js.
  - **`[2]`** Abre el instalador de PostgreSQL para Windows.
  - **`[3]`** Abre la consola de Servicios de Windows (`services.msc`) para iniciar PostgreSQL.
  - **`[R]`** Re-evalúa el sistema inmediatamente.
  - **`[Q]`** Cancela la instalación de forma segura.

---

### Paso 3: Selección de Carpeta de Destino
1. El instalador abrirá una ventana de selección de carpetas (*Folder Browser Dialog*).
2. Seleccione el directorio deseado (por defecto: `C:\CongresoETS2026` o elija su propia ruta).
3. El instalador normaliza la ruta, limpia comillas y barras residuales, y valida permisos de escritura en la ubicación elegida.

---

### Paso 4: Despliegue de Código y Scripts de Control
El instalador:
1. Copia de forma optimizada los módulos **Backend API**, **Frontend Web**, scripts del sistema y manuales de documentación técnica.
2. Despliega en la raíz de la carpeta elegida los scripts de control diario:
   - `Iniciar_Congreso.bat`
   - `Detener_Congreso.bat`
   - `Revisar_Servicios.bat`
   - `Reparar_BaseDatos.bat`
   - `MANUAL_INSTALACION_WINDOWS.md`
3. Despliega las herramientas auxiliares en la subcarpeta `scripts/` sin anidamientos.

---

### Paso 5: Asistente de Base de Datos PostgreSQL
El instalador solicitará los parámetros de conexión para PostgreSQL local:
- **Host:** Presione `Enter` (por defecto: `localhost`).
- **Puerto:** Presione `Enter` (detecta automáticamente si es `5432` o `5433`).
- **Usuario:** Presione `Enter` (por defecto: `postgres`).
- **Contraseña:** Ingrese la contraseña asignada a `postgres` durante la instalación.

**Operaciones automatizadas ejecutadas por el instalador:**
1. Valida conectividad y identificaciones con el motor PostgreSQL.
2. Comprueba si existe la base de datos `congreso_ets2026`:
   - **Si no existe:** La crea con codificación `UTF-8`, aplica el esquema maestro de 26 entidades (`schema_3fn.sql`) y carga los datos semilla (`seed.sql`).
   - **Si ya existe (instalación previa o actualización):** Preserva el 100% de los datos de usuarios, inscripciones y acreditaciones existentes, y ejecuta de forma automática el módulo de migración e integridad referencial (`reparar_integridad.sql`), incorporando columnas faltantes (como `capacidad_maxima`), corrigiendo referencias huérfanas y resincronizando las secuencias autoincrementales sin colisiones.
3. Ejecuta la verificación relacional final asegurando que todas las tablas, vistas y funciones del sistema queden en estado óptimo.

---

### Paso 6: Generación de Identificaciones y Seguridad Criptográfica
El instalador genera automáticamente los archivos de variables de entorno:
1. **`backend/.env`**:
   - Cadena de conexión cifrada hacia PostgreSQL (`DATABASE_URL`).
   - Clave criptográfica simétrica **AES-256-CBC** de 32 bytes (64 hex) con alta entropía para sellado de tokens QR.
   - Clave secreta para tareas programadas de recordatorios (`CRON_SECRET`).
   - Parámetros de servidor (`PORT=4000`).
2. **`frontend/.env.local`**:
   - URL base de enlace al API Backend: `NEXT_PUBLIC_API_URL="http://localhost:4000"`.

---

### Paso 7: Instalación de Dependencias y Compilación
1. **Instalación de paquetes:** Ejecuta `npm.cmd install` tanto en Backend como en Frontend excluyendo auditorías lentas (`--no-audit --no-fund`).
2. **Compilación de producción:**
   - **Backend:** Compila TypeScript a JavaScript nativo en `backend/dist/server.js`.
   - **Frontend:** Ejecuta la compilación de producción de Next.js (`frontend/.next/`).
3. *Resiliencia de arranque:* `Iniciar_Congreso.bat` incorpora un fallback automático que, si no detecta la compilación de producción, inicia fluidamente en modo desarrollo (`tsx` y `next dev`).

---

### Paso 8: Creación de Accesos Directos
Se creará automáticamente en el **Escritorio de Windows** del usuario actual el acceso directo:
- **`Congreso ETS 2026.lnk`**

---

---

## 🎮 3. Control y Operación Diaria del Sistema

### Iniciar la Plataforma
Tiene dos alternativas directas:
1. **Doble clic en el acceso directo del Escritorio:** `"Congreso ETS 2026"`.
2. O ejecutar desde la carpeta instalada:
   ```cmd
   Iniciar_Congreso.bat
   ```
El script:
- Inicia el servidor Backend en el puerto `4000`.
- Inicia el portal Frontend en el puerto `3000`.
- Comprueba la disponibilidad en red y abre de forma automática el navegador web predeterminado en:
  👉 **`http://localhost:3000`**

---

### Cuentas Administrativas y Operativas Preconfiguradas
Para acceder al panel de control, ingrese a **`http://localhost:3000/login`**:

| Nivel Jerárquico | Rol | Correo Electrónico | Contraseña Inicial | Alcance de Control |
| :--- | :--- | :--- | :--- | :--- |
| **Jerarquía 5** | Superadministrador | `superadmin.congreso@bue.edu.ar` | `SuperAdmin2026!` | Control total, configuración del sistema, auditoría forense y backups. |
| **Jerarquía 4** | Administrador DETS | `admin@ifts04.edu.ar` | `AdminCongreso2026!` | Gestión académica, temarios, cupos, edición WYSIWYG de certificados y encuestas. |
| **Jerarquía 3** | Verificador de Mesa | `verificador.dets@bue.edu.ar` | `Verificador2026!` | Mesa de entradas, contingencias y reasignaciones. |
| **Jerarquía 3** | Operador de Puerta | `operador1.puerta@bue.edu.ar` | `Operador2026!` | Escáner QR de acreditaciones, control de acceso offline/online y aforos. |

---

### Detener la Plataforma
Cuando finalice la jornada o desee cerrar los servicios ordenadamente:
1. Ejecute desde la carpeta de instalación:
   ```cmd
   Detener_Congreso.bat
   ```
2. El script localizará mediante PowerShell los procesos en los puertos `3000` y `4000` y los terminará de forma segura sin dejar procesos huérfanos en memoria.

---

### Diagnóstico Rápido del Sistema
Para comprobar el estado de Node.js, PostgreSQL y puertos en cualquier momento sin reinstalar:
```cmd
Revisar_Servicios.bat
```
El script ejecutará el diagnóstico de prerrequisitos y una prueba Smoke Test en vivo sobre `http://localhost:4000/api/health` y `http://localhost:3000/`.

---

### Verificación y Reparación de Integridad de Base de Datos
Si se sospecha de inconsistencias relacionales, columnas faltantes por actualizaciones previas o registros huérfanos, puede disparar en cualquier momento la herramienta autónoma de integridad:

1. **Desde Windows (Doble Clic):**
   ```cmd
   Reparar_BaseDatos.bat
   ```
2. **Desde la terminal PowerShell:**
   ```powershell
   .\scripts\reparar_integridad.ps1
   ```
3. **Desde el backend (CLI NPM):**
   ```cmd
   cd backend
   npm run db:repair
   ```

**Acciones que ejecuta la herramienta:**
- Audita y crea las tablas faltantes de las 26 entidades del sistema.
- Agrega automáticamente columnas ausentes (`capacidad_maxima`, `actualizado_en`, etc.).
- Normaliza aforos mínimos en recintos físicos.
- Reasigna claves foráneas huérfanas (usuarios, operadores y actividades).
- Sincroniza las 20 secuencias `SERIAL` (`setval`) al valor real `MAX(id)` para evitar colisiones de ID.
- Despliega una tabla visual de diagnóstico con el estado final.

Para comprobar el instalador en una base de datos limpia de prueba sin afectar la producción:
```cmd
cd backend
npm run test:installer
```

---

## 🗑️ 5. Procedimiento Completo de Desinstalación del Sistema

El sistema provee dos modalidades para desinstalar la plataforma de forma limpia, segura y sin dejar procesos huérfanos o puertos bloqueados en el sistema operativo.

### 5.1 Método A: Desinstalación Asistida Automatizada (Recomendado)

En la raíz del directorio instalado (ej. `C:\CongresoETS2026`), se encuentra el asistente interactivo:
```cmd
Desinstalar_Congreso.bat
```

#### Flujo del Asistente:
1. **Confirmación de Seguridad:** Solicita confirmación explícita para evitar ejecuciones accidentales.
2. **Detención Ordenada de Procesos:** Inspecciona los puertos `3000` y `4000`, localiza los PIDs de Node.js en memoria y los termina limpiamente.
3. **Resguardo Preventivo (Backup SQL):** Pregunta si desea generar un respaldo de seguridad antes de proceder. Si responde afirmativamente, ejecuta `pg_dump` y almacena el archivo `backup_previo_desinstalacion_[fecha].sql` en el Escritorio del usuario.
4. **Gestión de PostgreSQL:** Pregunta si desea conservar o eliminar la base de datos `congreso_ets2026`. Si elige eliminarla, desconecta las sesiones concurrentes (`pg_terminate_backend`) y ejecuta `DROP DATABASE congreso_ets2026`.
5. **Remoción de Accesos Directos:** Elimina el archivo `Congreso ETS 2026.lnk` del Escritorio de Windows.
6. **Finalización:** Informa que la plataforma ha sido dada de baja y que puede procederse a borrar la carpeta de la aplicación.

---

### 5.2 Método B: Desinstalación Manual Paso a Paso

Si prefiere realizar la desinstalación de forma manual o desatendida mediante la consola de PowerShell o CMD:

#### Paso 1: Detener los servicios activos
Abra PowerShell o CMD y ejecute:
```powershell
# Detener procesos en puertos 3000 y 4000:
$puertos = @(3000, 4000)
foreach ($p in $puertos) {
    Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force
    }
}
```
*(O simplemente ejecute `Detener_Congreso.bat` en la carpeta instalada).*

#### Paso 2: Exportar Backup de Seguridad (Opcional)
```cmd
set PGPASSWORD=tu_contraseña_postgres
pg_dump -h localhost -p 5432 -U postgres -d congreso_ets2026 -F p -f "%USERPROFILE%\Desktop\backup_seguridad_congreso.sql"
set PGPASSWORD=
```

#### Paso 3: Eliminar la Base de Datos de PostgreSQL
Abra una consola con acceso a `psql` o `dropdb`:
```cmd
set PGPASSWORD=tu_contraseña_postgres
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'congreso_ets2026' AND pid <> pg_backend_pid();"
psql -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS congreso_ets2026;"
set PGPASSWORD=
```

#### Paso 4: Eliminar Accesos Directos
```powershell
Remove-Item -Path "$([Environment]::GetFolderPath('Desktop'))\Congreso ETS 2026.lnk" -Force -ErrorAction SilentlyContinue
```

#### Paso 5: Eliminar el Directorio del Sistema
Elimine la carpeta de instalación (ejemplo: `C:\CongresoETS2026`) arrastrándola a la Papelera de Reciclaje o mediante terminal:
```powershell
Remove-Item -Path "C:\CongresoETS2026" -Recurse -Force
```

#### Paso 6: Conservación o Remoción de Prerrequisitos de Windows
> [!NOTE]
> **Node.js LTS** y **PostgreSQL Server** son motores compartidos que pueden albergar otros proyectos o bases de datos en la misma máquina. Por este motivo, el desinstalador **NO los remueve automáticamente**.
> Si desea desinstalarlos por completo:
> 1. Presione `Win + I` para abrir **Configuración de Windows**.
> 2. Vaya a **Aplicaciones -> Aplicaciones instaladas**.
> 3. Busque `Node.js` y seleccione **Desinstalar**.
> 4. Busque `PostgreSQL` y seleccione **Desinstalar**.

---

## 🛡️ 6. Reglas de Negocio Clave en la Plataforma

1. **Gestión de Participantes Sancionados:**
   - Todo asistente incluido en la **Lista Negra (`blacklist`)** se clasifica de manera automática en la categoría **`Sancionado`**, impidiendo que distorsione la Lista de Espera de cupos.
   - La **Lista de Espera** queda reservada estrictamente para aspirantes válidos en orden FIFO.
2. **Exclusividad de Diplomas y Diseñador WYSIWYG:**
   - La emisión y descarga de diplomas está autorizada **únicamente para asistentes y estudiantes**. Los operadores y directivos no reciben diplomas de asistencia.
   - El sistema incorpora un **Editor Visual WYSIWYG** en `/admin?tab=certificados` con previsualizador y descarga PDF vectorial.
   - Requiere completar la Encuesta de Calidad obligatoria (bloqueo pedagógico; los administradores poseen bypass de auditoría).
3. **Identificación Oficial en Hoja A4 Única:**
   - Formato estandarizado para impresión de gafetes en 1 sola hoja A4 con guías de doblado (10 × 15 cm) para portaidentificaciones.
4. **Alertas e Interfaz:**
   - 100% de alertas operativas se presentan con **SweetAlert2**, garantizando una interfaz moderna y uniforme.

---

## ❓ 7. Preguntas Frecuentes y Solución de Problemas

#### 1. ¿Qué hacer si PowerShell muestra un mensaje de "Directiva de ejecución restringida"?
No debe preocuparse. Todos los scripts lanzadores (`Instalar_CongresoETS2026.bat`, `Iniciar_Congreso.bat`, `Detener_Congreso.bat`, `Revisar_Servicios.bat`, `Reparar_BaseDatos.bat` y `Desinstalar_Congreso.bat`) invocan PowerShell con el modificador `-ExecutionPolicy Bypass`, permitiendo su ejecución sin alterar la directiva global de seguridad del sistema.

#### 2. Mi PostgreSQL usa el puerto 5433 en lugar del 5432
El instalador detecta automáticamente los puertos activos en tiempo real. Si detecta el puerto 5433, lo sugiere de forma predeterminada en el asistente de base de datos; simplemente presione `Enter`.

#### 3. El puerto 3000 o 4000 aparece ocupado
Ejecute `Detener_Congreso.bat` para liberar los procesos activos en esos puertos antes de volver a iniciar la plataforma.

#### 4. Control de Versiones con Git
Si desea verificar o sincronizar el estado del repositorio de la plataforma, abra una terminal en la carpeta instalada y ejecute:
```powershell
git status
git log --oneline -n 5
```
