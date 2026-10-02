const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:V-129057-t@localhost:5433/congreso_ets2026' });
client.connect()
  .then(() => client.query("INSERT INTO blacklist (dni_pasaporte, motivo, registrado_por, registrado_en, activo) VALUES ('14331279', 'aettstrhsry', 'SISTEMA', NOW(), true)"))
  .then(res => { console.log('Re-inserted rows:', res.rowCount); client.end() })
  .catch(console.error);
