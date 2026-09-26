Aquí tienes el detalle completo y verificado de las credenciales de:


         la **Base de Datos**, 
         el **Sistema Administrativo / Operadores**, 
         el **Servicio de Correo SMTP** 
         y las **Claves Criptográficas**:

---

### 1. Base de Datos (PostgreSQL)

    | :------------------------------- | :--------------------------------------------------------------------- |
    | Parámetro                        | Valor                                                                  |
    | :------------------------------- | :--------------------------------------------------------------------- |
    | **Motor**                        | PostgreSQL 16                                                          |
    | **Host**                         | `localhost` (o `127.0.0.1`)                                            |
    | **Puerto**                       | `5433`                                                                 |
    | **Nombre de BD**                 | `congreso_ets2026`                                                     |
    | **Usuario**                      | `congreso_app`                                                         |
    | **Contraseña**                   | `V-129057-t`                                                           |
    | **Cadena de Conexión (URI)**     | `postgresql://congreso_app:V-129057-t@localhost:5433/congreso_ets2026` |
    | :------------------------------- | :--------------------------------------------------------------------- |
---

### 2. Credenciales del Sistema de Operadores y Administración (`/login`)

Acceso al panel administrativo: `http://localhost:3000/login`

    | :------------------------- | :-------: | :------------------------------- | :------------------- | :----------------------------------- |
    | Rol / Perfil                | Jerarquía | Email Institucional              | Contraseña           | Punto de Acceso Predeterminado       |
    | :------------------------- | :-------: | :------------------------------- | :------------------- | :----------------------------------- |
    | **Superadmin General**     |     5     | `superadmin.congreso@bue.edu.ar` | `SuperAdmin2026!`    | Auditorio Saavedra / Control Total   |
    | **Administrador General**  |     4     | `admin@ifts04.edu.ar`            | `AdminCongreso2026!` | Auditorio Saavedra / Gestión y Temas |
    | **Verificador Pergaminos**  |     4     | `verificador.dets@bue.edu.ar`     | `Verificador2026!`    | Homologación de Expositores          |
    | **Operador Puerta 1**      |     3     | `operador1.puerta@bue.edu.ar`    | `Operador2026!`      | Acceso General - Puerta Principal    |
    | **Operador Puerta 2**      |     3     | `operador2.lateral@bue.edu.ar`   | `Operador2026!`      | Acceso General - Puerta Lateral      |
    | :------------------------- | :-------: | :------------------------------- | :------------------- | :----------------------------------- |
---

### 3. Servicio de Correo SMTP (Google / Notificaciones Institucionales)

Configurado en el backend ([.env](file:///home/nestor/Documentos/0_AplicacionesWEB/CongresoNew/backend/.env)) y en la tabla `configuraciones_sistema`:

    | :------------------------ | :----------------------------------------------------------- |
    | Parámetro                 | Valor                                                        |
    | :------------------------ | :----------------------------------------------------------- |
    | **Servidor Host**         | `smtp.gmail.com`                                             |
    | **Puerto**                | `587` (STARTTLS) / `465` (SSL)                               |
    | **Usuario / Remitente**   | `nestor.pineiro@gmail.com`                                   |
    | **Contraseña / App Token**|  `V-129057-T`                                                |
    | **Cabecera Remitente**    |  `Congreso ETS 2026 – DETS GCABA <nestor.pineiro@gmail.com>` |
    | :------------------------ | :----------------------------------------------------------- |
---

### 4. Claves Criptográficas y Secretos del Sistema

    | Clave              | Finalidad                                            | Valor Configurado                                                  |
    | :----------------- | :--------------------------------------------------- | :---------------------------------------------------------------- |
    | `ENCRYPTION_KEY`   | Firma y cifrado AES-256-CBC de QRs de credenciales   | `e4b7c1a89f2d3e4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a`|
    | `CRON_SECRET`      | Autentic. de triggeres programados de 48hs y backups | `congreso_ets2026_cron_secret_48hs`                               |
        
        
        
        
        
        
        
        
