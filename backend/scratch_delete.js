const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:V-129057-t@localhost:5433/congreso_ets2026' });
client.connect()
  .then(() => client.query("DELETE FROM blacklist WHERE dni_pasaporte = '14331279'"))
  .then(res => { console.log('Deleted rows:', res.rowCount); client.end() })
  .catch(console.error);
