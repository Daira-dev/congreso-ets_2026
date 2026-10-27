# Documento de Requerimientos Técnicos y Funcionales

## Metadatos

* **Tipo de documento:** Especificación funcional y técnica para desarrollo / Prompt de ejecución para IA.
* **Objetivo:** Implementar mejoras de navegación en Backend, controles dinámicos y de contenido en CMS Frontend, gestión de activos multimedia en Materiales, y política de backup con purga de datos en Copias de Seguridad.
* **Formato de salida esperado para tareas:** Código fuente, migraciones de base de datos, scripts/jobs de mantenimiento, endpoints de API y vistas frontend asociadas.

---

## 1. Módulo: Backend - Pantalla Inicial / Dashboard

### 1.1. Ordenamiento de Secciones

* **Contexto:** Botonera principal de acceso rápido a módulos en la pantalla inicial del Backend.
* **Requerimiento:** Ordenar alfabéticamente (A-Z) los botones de navegación correspondientes a las siguientes secciones:
  1. Accesos
  2. Actividades
  3. Auditoría
  4. Certificados
  5. CMS Frontend
  6. Configuración
  7. Cron
  8. Encuestas
  9. Estadísticas
  10. Eventos
  11. Homologación
  12. Identificaciones
  13. Lista Negra
  14. Manuales *(normalizar capitalización si aplica)*
  15. Materiales
  16. Materias
  17. Operadores
  18. Participantes
  19. Ponentes
  20. Recintos
  21. Tablero
* **Criterio de Aceptación:**
  * La botonera renderiza los elementos ordenados lexicográficamente de forma insensible a mayúsculas/minúsculas.
  * No se altera la ruta o permiso de ninguno de los accesos existentes.

---

## 2. Módulo: CMS Frontend

### 2.1. Editor WYSIWYG para Sección HERO

* **Requerimiento:** Integrar un editor visual WYSIWYG en el Hero de la página principal.
* **Referencia técnica:** Utilizar la misma implementación y stack de editor existente en el módulo `Identificaciones`.
* **Alcance editable:**
  * Imagen o activo de fondo (background).
  * Títulos, subtítulos y cuerpos de texto.
  * Imágenes internas y componentes secundarios embebidos en el Hero.
* **Criterio de Aceptación:**
  * Los cambios guardados deben persistir en la base de datos y reflejarse inmediatamente en el frontend público.

### 2.2. Visibilidad Dinámica de Secciones

* **Requerimiento:** Sistema granular de visibilidad mediante checkboxes en el panel administrativo.
* **Regla de negocio:** Afecta a todas las secciones intermedias del layout público (excluyendo estrictamente `NAV` / Navbar y `FOOTER`).
* **Comportamiento:**
  * Cada sección intermedia debe contar con un toggle o checkbox (`enabled: true/false`).
  * Si una sección está deshabilitada, el DOM no la renderiza o se omite en la respuesta del API.

### 2.3. CRUD de Carrousel (Slider)

* **Requerimiento:** Módulo de administración para carrouseles multimedia.
* **Capacidades funcionales:**
  * **Soporte de medios:** Imágenes y videos.
  * **Cantidad:** Adición, edición y eliminación de slides sin límite rígido.
  * **Reordenamiento:** Capacidad de definir el orden de visualización (índice numérico o drag-and-drop).
  * **Temporizador:** Configuración del tiempo de permanencia (duración/autoplay en segundos o milisegundos) de forma individual por elemento.
  * **Slide predeterminado:** Selector para designar cuál es el slide inicial que se muestra al cargar la página.
* **Criterio de Aceptación:**
  * Endpoints listos para `GET`, `POST`, `PUT/PATCH` y `DELETE`.
  * Validación del tipo de archivo y fallback en caso de slide no disponible.

---

## 3. Módulo: Materiales

### 3.1. CRUDs de Imágenes por Categorías y Tarjetas

* **Requerimiento:** Gestión de archivos de imagen a dos niveles:
  1. Por categoría de material.
  2. Dentro de cada tarjeta/ítem individual de material.
* **Requisitos de Validación e Interfaz:**
  * Mostrar en la interfaz de carga las dimensiones recomendadas (ancho x alto en píxeles) y la resolución esperada (DPI/formato).
  * Validar tipos MIME permitidos en frontend y backend.

### 3.2. Política de Almacenamiento y Persistencia

* **Almacenamiento de archivos:** Guardar los archivos de imagen sin alteraciones de compresión destructiva (*"as they are"*) en el directorio ad-hoc:
  ```text
  imagenes_de_materiales/
  ```
* **Persistencia en Base de Datos:**
  * No almacenar blobs binarios en la tabla.
  * Guardar exclusivamente la URL o path relativo accesible que apunte al archivo guardado en el servidor/storage.

---

## 4. Módulo: Copias de Seguridad (Backups)

### 4.1. Backup y Limpieza de Base de Datos de Visitantes

* **Contexto:** Mantenimiento, optimización y preservación de registros históricos de visitantes.
* **Flujo estricto de ejecución:**
  1. **Generación de Backup:** Ejecutar el volcado/exportación completa y segura de la tabla o base de datos de visitantes (formato estructurado SQL, JSON o gzip según stack).
  2. **Verificación del Respaldo:** Validar que el archivo de respaldo se haya generado correctamente, esté íntegro y debidamente almacenado en la ruta o storage definido para backups.
  3. **Purga / Limpieza (Truncate / Purge):** Una vez verificado el almacenamiento exitoso del backup, proceder con la eliminación/limpieza de los registros de visitantes para reducir la carga de la base de datos operativa.
* **Manejo de Errores y Seguridad:**
  * Si el proceso de backup falla o no se confirma su persistencia, la operación de limpieza **debe abortarse inmediatamente** (principio de atomicidad/fail-safe) evitando cualquier pérdida accidental de información.
  * Registrar la ejecución en el log de auditoría del sistema (fecha, hora, usuario o trigger, registros respaldados y estado de la limpieza).

---

## 5. Instrucciones para el Asistente de IA / Motor de Generación de Código

Al procesar este documento para generar la solución:

1. Respetar la arquitectura actual del proyecto (controladores, modelos, servicios y rutas existentes).
2. Seguir el patrón de diseño ya implementado en el módulo `Identificaciones` para mantener consistencia de código en el CMS.
3. Asegurar que las migraciones y rutinas contemplen:
   * Estados de visibilidad de secciones dinámicas.
   * Configuración de tiempos y slides del carrousel.
   * URLs de imágenes de categorías y tarjetas de materiales.
   * Scripts, servicios transaccionales o tareas programadas seguras para el backup y vaciado de visitantes en `Copias de Seguridad`.