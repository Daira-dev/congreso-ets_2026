const { query } = require('./dist/lib/db.js');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  try {
    const newHash = 'a757e462012b2eee238c3b86e9b49f1d:2f7faf31466e62b5230e2fceab642e3947588cb7d0d790a4cec601e21557864ac87d156e896f4e854d691c07773bd1a96160737d7a912119b8efb4678e021dc2';
    await query("UPDATE operadores SET password_hash = $1", [newHash]);
    console.log("Passwords updated successfully.");
  } catch (err) {
    console.error("Error updating passwords:", err);
  } finally {
    process.exit(0);
  }
}
run();
