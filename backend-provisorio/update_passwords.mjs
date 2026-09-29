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
    console.log('✅ Conexión exitosa a la base de datos.');

    const newPassword = 'admin';
    const newHash = hashPassword(newPassword);

    await client.query('UPDATE operadores SET password_hash = $1', [newHash]);
    
    console.log(`✅ Contraseñas de todos los operadores actualizadas a: "${newPassword}"`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updatePasswords();
