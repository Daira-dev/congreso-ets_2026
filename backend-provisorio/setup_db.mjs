import fs from 'fs';
import pg from 'pg';
import path from 'path';

const { Client } = pg;

async function setup() {
  const defaultClient = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
  });

  try {
    await defaultClient.connect();
    console.log('✅ Conexión exitosa a Postgres default.');
    
    const dbCheck = await defaultClient.query("SELECT 1 FROM pg_database WHERE datname = 'congresoets_dbprovisoria'");
    if (dbCheck.rows.length === 0) {
      console.log('🔄 Creando base de datos congresoets_dbprovisoria...');
      await defaultClient.query('CREATE DATABASE congresoets_dbprovisoria');
      console.log('✅ Base de datos creada.');
    } else {
      console.log('ℹ️ La base de datos ya existe.');
    }
  } catch (error) {
    console.error('❌ Error creando DB:', error.message);
    return;
  } finally {
    await defaultClient.end();
  }

  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/congresoets_dbprovisoria'
  });

  try {
    await client.connect();
    console.log('✅ Conexión exitosa a congresoets_dbprovisoria.');

    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    const seedPath = path.join(process.cwd(), 'src', 'db', 'seed.sql');

    const schema = fs.readFileSync(schemaPath, 'utf8');
    const seed = fs.readFileSync(seedPath, 'utf8');

    console.log('🔄 Ejecutando schema.sql...');
    await client.query(schema);
    console.log('✅ schema.sql ejecutado.');

    console.log('🔄 Ejecutando seed.sql...');
    await client.query(seed);
    console.log('✅ seed.sql ejecutado.');

    console.log('🎉 Todo listo!');
  } catch (error) {
    console.error('❌ Error ejecutando scripts:', error.message);
  } finally {
    await client.end();
  }
}

setup();
