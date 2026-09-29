import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function updatePasswords() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/congresoets_dbprovisoria'
  });

  try {
    await client.connect();
    
    const users = [
      { email: 'superadmin.congreso@bue.edu.ar', pass: 'SuperAdmin2026!', role: 'Superadmin', nombre: 'Super', apellido: 'Admin' },
      { email: 'admin@ifts4.edu.ar', pass: 'AdminCongreso!', role: 'Administrador', nombre: 'Admin', apellido: 'IFTS' },
      { email: 'verificador.dets@bue.edu.ar', pass: 'Verificador2026!', role: 'Verificador', nombre: 'Verificador', apellido: 'DETS' },
      { email: 'operador1.puerta@bue.edu.ar', pass: 'Operador2026!', role: 'Operador', nombre: 'Operador', apellido: 'Puerta' },
    ];

    for (const u of users) {
      const hash = hashPassword(u.pass);
      
      const roleRes = await client.query('SELECT id FROM roles WHERE nombre = $1 LIMIT 1', [u.role]);
      const rol_id = roleRes.rows[0].id;
      
      const puntoRes = await client.query('SELECT id FROM puntos_acceso LIMIT 1');
      const punto_id = puntoRes.rows[0].id;

      if (u.email === 'admin@ifts4.edu.ar') {
        await client.query("UPDATE operadores SET email_institucional = 'admin@ifts4.edu.ar' WHERE email_institucional = 'admin@ifts04.edu.ar'");
      }

      await client.query(`
        INSERT INTO operadores (nombre, apellido, email_institucional, password_hash, rol_id, punto_acceso_default_id, activo)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (email_institucional) DO UPDATE 
        SET password_hash = $4, rol_id = $5
      `, [u.nombre, u.apellido, u.email.toLowerCase(), hash, rol_id, punto_id]);
      
      console.log(`✅ ${u.email} actualizado con la contraseña ${u.pass}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updatePasswords();
